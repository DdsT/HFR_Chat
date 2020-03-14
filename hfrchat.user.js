// ==UserScript==
// @name        [HFR] Chat
// @namespace   ddst.github.io
// @version     1.0.3
// @author      DdsT
// @description Personnalisation de l'affichage du forum
// @icon        https://www.hardware.fr/images_skin_2010/facebook/logo.png
// @URL         https://ddst.github.io/HFR_Chat/
// @downloadURL https://ddst.github.io/HFR_Chat/hfrchat.user.js
// @updateURL   https://ddst.github.io/HFR_Chat/hfrchat.meta.js
// @supportURL  https://ddst.github.io/HFR_Chat/
// @require     https://raw.githubusercontent.com/Wiripse/HFRGMTools/master/MPStorage.user.js?v=2019.10.3.3
// @match       *://forum.hardware.fr/forum2*
// @match       *://forum.hardware.fr/setperso*
// @match       *://forum.hardware.fr/hfr/*/*sujet_*
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.deleteValue
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @run-at      document-start
// ==/UserScript==

/*
Copyright (C) 2020 DdsT

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see https://ddst.github.io/HFR_Live/LICENSE.
*/

/* Icons by Mark James - http://www.famfamfam.com/lab/icons/silk/ - CC BY 2.5 - https://creativecommons.org/licenses/by/2.5/ */

/* TODO
 * ----
 * Améliorer le rendu des avatars lors de leur agrandissement
 * Corriger le bug de suppression des sauts de ligne dans les citations et balises [fixed]
 * Gérer les icones à droite de la barre d'outils
 */

/* v1.0.3
 * ------
 * Limite la hauteur des images de la barre d'outils à 16 pixels
 */

/*****************
 * CONFIGURATION *
 *****************/

const VERSION = GM.info.script.version;

/* Configuration par défaut */
const DEFAULT_CONFIG = {
  version         : VERSION,   // version du script de cette configuration
  date            : 0,         // date de création de la configuration
  formatLayout    : true,      // l'habillage du tableau des messages est modifié
  formatAvatar    : true,      // les avatars sont redimensionnés
  moveProfile     : true,      // les informations du profil sont déplacés dans la barre d'outil
  hideToolbar     : true,      // la barre d'outil est masquée
  formatDate      : true,      // la date du message est formattée de manière compacte
  colorName       : true,      // une couleur est attribuée à chaque pseudo
  addAvatar       : true,      // un avatar est ajouté aux membres qui n'en ont pas
  formatEdit      : true,      // la zone d'indication d'édition et de citation est formatée
  formatQuote     : true,      // les citations dans les messages sont reformatées
  formatSpoiler   : true,      // les spoilers dans les messages sont reformatées
  observe         : true,      // les messages créé par d'autres scripts sont traités
  forumWidth      : 1200,      // largeur du tableau des messages en pixels
  profileWidth    : 50,        // largeur de la colonne de profil en pixels
  avatarWidth     : 50,        // largeur des avatars en pixels
  pageBackground  : "#eeeeee", // fond de la page (derrière le tableau des messages)
  forumBackground : "#ffffff", // fond du tableau des messages
  toolbarColor    : "#999999", // couleur du texte de la barre d'outils
  hideBorders     : true,      // les bords latéraux du tableau des messages sont masqués
  toolbarDelay    : 300,       // délai avant l'apparition de la barre d'outil au passage de la souris
  moodStatusDelay : 1000,      // délai avant la disparition des informations d'un profil au passage de la souris
  refreshDelay    : 1000,      // délai avant le rechargement de la page une fois les paramètres validés
};

let config;            // Configuration du script
let useMPStorage;      // utilisation de MPStorage
let LocalMPStorage = { // MPStorage
  version : '0.1',
  toolName : '[HFR] Chat',
  hfrChat : void 0,
  initMPStorage() {
    return new Promise((resolve, reject) => {
      try {
        Promise.all([
          GM.getValue('mpStorage_username', void 0),
          GM.getValue('mpStorage_mpId', void 0),
          GM.getValue('mpStorage_mpRepId', void 0)
        ]).then(function([
          mpStorage_username,
          mpStorage_mpId,
          mpStorage_mpRepId
        ]){
          mpStorage.initLocalStorage(mpStorage_username, mpStorage_mpId, mpStorage_mpRepId, function(dataz){
            LocalMPStorage.hfrChat = dataz.data.filter(function(d){return LocalMPStorage.version === d.version;})[0].hfrChat;
            GM.setValue('mpStorage_username', mpStorage.username);
            GM.setValue('mpStorage_mpId', mpStorage.mpId);
            GM.setValue('mpStorage_mpRepId', mpStorage.mpRepId);
            resolve();
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  },
  // Sauvegarde des paramètres dans le MP - méthode propre à [HFR] Chat
  setStorageData() {
    LocalMPStorage.hfrChat = {
      config : config,
      sourceName : LocalMPStorage.toolName,
      lastUpdate : Date.now(),
    };
    mpStorage.storageData.data.filter(d => LocalMPStorage.version === d.version)[0].hfrChat = LocalMPStorage.hfrChat;
    mpStorage.setStorageData(mpStorage.storageData, LocalMPStorage.toolName); 
  }
};

/* Démarrage du script */
initialize();

/********************
 * FORMATTAGE FORUM *
 ********************/

function formatLayoutCss() {
  return `
  body {
    background-color : ${config.pageBackground};
  }

  #mesdiscussions {
    background-color : ${config.forumBackground};
    max-width        : ${config.forumWidth}px;
    border-radius    :    8px;
    padding          :   12px;
  }

  #mesdiscussions .messagetable .messCase1 {
    border-right : none;
    border-left  : ${(config.hideBorders)?"none":""};
  }

  #mesdiscussions .messagetable .messCase2, #mesdiscussions .messagetable {
    border-left  : none;
    border-right : ${(config.hideBorders)?"none":""};
  }

  #mesdiscussions .messagetable>tbody>tr>td {
  padding-top    : 12px;
  padding-bottom : 12px;
  }

  #mesdiscussions img {
    max-width  : 100%;
    transition : max-width 0.5s ease 0.5s;
  }

  #mesdiscussions img:hover {
    max-width : 200%;
  }

  #mesdiscussions .messCase1 {
    width : ${config.profileWidth}px;
  }
  `
};

/**********************
 * FORMATTAGE AVATARS *
 **********************/
  
function formatAvatarCss() {
  return `
  #mesdiscussions .avatar_center>div {
    width            : ${Math.min(config.profileWidth,config.avatarWidth)}px;
    height           : ${Math.min(config.profileWidth,config.avatarWidth)}px;
    border-radius    : 50%;
    clear            : both;
  }
  
  #mesdiscussions .avatar_center img {
    object-fit       : cover;
    border-radius    : 50%;
    height           : ${Math.min(config.profileWidth,config.avatarWidth)}px;
    width            : ${Math.min(config.profileWidth,config.avatarWidth)}px;
    max-width        : ${Math.min(config.profileWidth,config.avatarWidth)}px;
    overflow         : visible;
  }
  
  #mesdiscussions .avatar_center img:hover {
    z-index          : 2;
    border-radius    : 0;
    height           : auto;
    width            : auto;
    max-width        : 150px;
    max-height       : 100px;
    filter           : drop-shadow(0px 0px 2px #666);
    transition       : max-width 0.3s ease 0.5s, border-radius 0.1s ease 0s;
  }
  `
};

/********************
 * NOUVEAUX AVATARS *
 ********************/

function addAvatarCss() {
  return `
  #mesdiscussions .hfr-chat-newavatar>div {
    width         : ${Math.min(config.profileWidth,config.avatarWidth)}px;
    height        : ${Math.min(config.profileWidth,config.avatarWidth)}px;
    border-radius : 50%;
    color         : #fff;
    font-size     : ${Math.min(config.profileWidth,config.avatarWidth)/2}px;
    font-weight   : bold;
    line-height   : ${Math.min(config.profileWidth,config.avatarWidth)*24/25}px;
    clear         : both;
    margin        : auto;
  }
  `
};

/* Ajouter un avatar à un message qui n'en a pas */
function addAvatar(node) {
  for (const profile of node.querySelectorAll("td.messCase1")) {
    if (!profile.querySelector(".avatar_center")) {
      let name = profile.querySelector("b.s2");
      let div = document.createElement("div");
      div.className = "avatar_center hfr-chat-newavatar";
      //div.style = "clear:both";
      let img = document.createElement("div");
      if (name.innerHTML.replace(/\u200b/g, "") == "Modération") {
        img.style.backgroundColor = "red";
        img.innerHTML = "!";        
      } else if (name.innerHTML.replace(/\u200b/g, "") == "Profil supprimé") {
        img.style.backgroundColor = "grey";
        img.innerHTML = "?";        
      } else {
        img.style.backgroundColor = stringToHSL(name.innerHTML.replace(/\u200b/g, "").toLowerCase());
        img.innerHTML = name.innerHTML.slice(0,1).toUpperCase();
      }
      div.appendChild(img);
      profile.appendChild(div);
    }
  }  
}

/*************************
 * DÉPLACEMENT DU PROFIL *
 *************************/

function moveProfileCss() {
  return `
  #mesdiscussions .messCase1 {
    opacity    : 0;
  }

  #mesdiscussions .message b.s2 {
    color        : #000;
  }

  #mesdiscussions .messCase1 b.s2 {
    display : none;
  }

  #mesdiscussions .hfr-chat-namecontainer {
    display : none;
  }

  #mesdiscussions .hfr-chat-date {
    margin-left : 4px;
  }

  #mesdiscussions .MoodStatus {
    border      : 1px solid rgb(0,0,0,0.2);
    padding     : 1px;
    margin-left : 4px;
  }

  #mesdiscussions .TransactionsReportsLink {
    padding      : 1px;
    margin-right : 5px;
  }

  #mesdiscussions .MDStatus {
    padding     : 1px;
    margin-left : 2px;
    color       : red;
  }

  #mesdiscussions .messCase2 {
    max-width     : 0;
    position      : relative;
    overflow-wrap : break-word;
  }

  #mesdiscussions .avatar_center{
    position : relative;
  }

  #mesdiscussions .toolbar>span {
    float : left;
  }

  #mesdiscussions .toolbar img {
    max-height : 16px;
  }

  #mesdiscussions .message .right {
    float   : none;
    display : inline;
  }

  #mesdiscussions .ct-profile {
    float      : left;
    position   : absolute;
    left       : -14px;
    top        : 5px;
    box-shadow : none;
  }

  #mesdiscussions .ct-profile:hover {
  box-shadow :  1px  1px 3px rgba(0, 0, 0, 0.15),
               -1px -1px 3px rgba(0, 0, 0, 0.15),
               -1px  1px 3px rgba(0, 0, 0, 0.15),
                1px -1px 3px rgba(0, 0, 0, 0.15);
  }

  #mesdiscussions .ct-note-container {
    display     : inline-block;
    font-weight : bold;
    margin-left : 2px;
  }

  #mesdiscussions .ct-input {
    margin-left : 20px;
  }
  `
};

/* Déplacer les informations du profil vers la barre d'outil */
function moveProfile(node) {
  for (const profile of node.querySelectorAll("td.messCase1")) {
    let name = profile.querySelector("b.s2");
    let avatar = profile.querySelector(".avatar_center");
    let moodStatus = profile.querySelector(".MoodStatus");
    let mdStatus = profile.querySelector(".MDStatus");
    let divRight = profile.querySelector("div.right");
    let transactions = profile.querySelector(".TransactionsReportsLink");
    let toolbar = profile.parentNode.querySelector(".toolbar");
    let iconBar = toolbar.querySelector(".left");
    let span = document.createElement("span");
    let namespan = document.createElement("span");
    let namespanContainer = document.createElement("span");
    let date = document.createElement("span");
    
    if (avatar) profile.insertBefore(avatar, divRight);
    if (name.innerHTML != "Publicité") date = moveDate(iconBar);
    
    namespanContainer.className = "hfr-chat-namecontainer";
    span.appendChild(namespan).appendChild(name);
    namespan.appendChild(namespanContainer);
    if(mdStatus) span.appendChild(mdStatus);
    if(moodStatus) namespanContainer.appendChild(moodStatus);
    if (transactions) namespanContainer.appendChild(transactions);
    namespanContainer.show = () => namespanContainer.style.display = "inline-block";
    namespanContainer.hide = () => namespanContainer.style.display = "none";
    let timeout;
    name.addEventListener("mouseover", () => {
      namespanContainer.show();
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    });
    name.addEventListener("mouseleave", () => {
      if (!timeout) timeout = setTimeout(namespanContainer.hide, config.moodStatusDelay);
    });
    
    span.appendChild(date);
    toolbar.prepend(span);
    iconBar.prepend(divRight);
    
    // Le changement d'opacité de 0 à 1 permet de cacher le profil tant que la page n'est pas complètement traitée
    profile.style.opacity = 1;
    
    // Compatibilité avec les autres scripts
    let colorTag = profile.querySelector(".ct-button");
    if(colorTag) span.prepend(colorTag);
    let colorTagNote = profile.querySelector(".ct-note-container");
    if(colorTagNote) namespan.appendChild(colorTagNote);
    let lastPostHighlight = toolbar.querySelector(".gm_hfr_lph_led, .gm_hfr_lpsl_led");
    if(lastPostHighlight) span.insertBefore(lastPostHighlight, date);
    // Ajout d'un pseudo invisible dans la case de profil pour les scripts de liste noire
    let dummyName = name.cloneNode(true);
    dummyName.classList.add("hfr-chat-dummy");
    profile.appendChild(document.createElement("div")).appendChild(dummyName);
  }
}

/* Déplacer la date dans la barre d'outil */
function moveDate(iconBar) {
  let span = iconBar.querySelector(".hfr-chat-date");
  if (!span) {
    span = document.createElement("span");
    span.innerHTML = iconBar.innerHTML.match(/Posté le .{10}&nbsp;à&nbsp;.{8}/g)[0];
    for (let i = 0; i < iconBar.childNodes.length; ++i) {
      let curNode = iconBar.childNodes[i];
      if ((curNode.nodeValue ? curNode.nodeValue : "").match(/Posté le .*/g)) {
          curNode.nodeValue = "";
      }
    }
  }
  return span;
}

/**************************
 * MASQUAGE BARRE D'OUTIL *
 **************************/

function hideToolbarCss() {
  return `
  #mesdiscussions .message .toolbar {
    transition       : all 0.3s ease 0s;
    border-bottom    : none;
    color            : ${config.toolbarColor};
    display          : flex;
  }

  #mesdiscussions .message .toolbar img {
    opacity          : 1;
  }
  #mesdiscussions .toolbar>.left {
    opacity          : 0;
    transition       : all 0.5s ease ${config.toolbarDelay/1000}s;
    flex-grow        : 1;
  }
  #mesdiscussions .toolbar>.left:hover {
    opacity          : 1;
  }
  `
};

/******************
 * FORMATAGE DATE *
 ******************/

/* Remplacer la date dans la barre d'outil */
function formatDate(node) {
  for (const iconBar of node.querySelectorAll(".toolbar .left")) {
    let span = document.createElement("span");
    span.className = "hfr-chat-date";
    let dateText = iconBar.innerHTML.match(/Posté le .{10}&nbsp;à&nbsp;.{8}/g)[0];
    let date = dateText.match(/\d\d-\d\d-\d\d\d\d/g)[0].replace(/-/g,"/");
    let time = dateText.match(/\d\d:\d\d:\d\d/g)[0];
    let shortTime = dateText.match(/\d\d:\d\d/g)[0];
    let day = smartDate(date);
    for (let i = 0; i < iconBar.childNodes.length; ++i) {
        let curNode = iconBar.childNodes[i];
        if ((curNode.nodeValue ? curNode.nodeValue : "").match(/Posté le .*/g)) {
            curNode.nodeValue = "";
        }
    }
    span.innerHTML = day + shortTime;
    span.onmouseover = () => span.innerHTML = date + " à " + time;
    span.onmouseout = () => span.innerHTML = day + shortTime;
    iconBar.prepend(span);
  }
}

/* Convertir la date dans un format court */
function smartDate(date){
  let todayDate = new Date();
  let yesterdayDate = (d => new Date(d.setDate(d.getDate()-1)))(new Date);
  let shortDate = date.match(/\d\d\/\d\d/g)[0];
  let sameYear = todayDate.getFullYear() == date.match(/\d\d\d\d/g)[0];
  let today = ("0" + todayDate.getDate()).slice(-2) + "/" + ("0"+(todayDate.getMonth()+1)).slice(-2)  + "/" + todayDate.getFullYear();
  let yesterday = ("0" + yesterdayDate.getDate()).slice(-2) + "/" + ("0"+(yesterdayDate.getMonth()+1)).slice(-2)  + "/" + yesterdayDate.getFullYear();
  let day = `${sameYear ? (yesterday == date) ? "Hier " : shortDate : date}  à `;
  if (today == date) day = "";
  return day;
}

/**************
 * COLORATION *
 **************/

/* Colorier un pseudo */
function colorName(node) {
  for (const name of node.querySelectorAll("td.messCase1 b.s2")) {
    if (name.innerHTML.replace(/\u200b/g, "") == "Modération") {
      name.style.color = "red";    
    } else if (name.innerHTML.replace(/\u200b/g, "") == "Profil supprimé") {
      name.style.color = "grey";       
    } else {
      name.style.color = stringToHSL(name.innerHTML.replace(/\u200b/g, "").toLowerCase());
    }
  }
}

/* Assigner une couleur à une chaine de caractères */
function stringToHSL(string) {
    let hash = 0;
    if (string.length != 0) {
      for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
      } 
    }
    return "hsl(" + (hash % 360) + ","+ (100 - (hash % 15)) + "%," + (30 + (hash % 15)) + "%)";
};

/**********************
 * FORMATAGE CITATION *
 **********************/

function formatQuoteCss() {
  return `
  #mesdiscussions table.citation, #mesdiscussions table.quote {
    border           : none;
    border-left      : 3px solid rgb(0,0,0,0.45);
    width            : 100%;
    border-radius    : 0px;
  }
  #mesdiscussions table.citation b.s1>a, #mesdiscussions table.quote b.s1>a {
    text-decoration  : none;
    font-size        : 11px;
  }
  table.quote b.s1,
  table.quote td>br,
  td>p>br:first-child,
  td>p>br:last-child,
  table.citation td>br {
    display          : none;
  }
  #mesdiscussions table.citation>tbody>tr>td>p {
    margin-top       : 5px;
  }
  #mesdiscussions table.citation, #mesdiscussions table.quote {
    padding-top      : 0px;
    background-color : rgb(0,0,0,0.05);
  }
  .hfr-chat-a-ecrit {
    display : none;
  }
  `
};

/* Formatter les citations d'un message */
function formatQuote(node) {
  for (const name of node.querySelectorAll("td.messCase2 table.citation b.s1>a")) {
    name.innerHTML = name.innerHTML.replace(/( a écrit :)/g, "<span class='hfr-chat-a-ecrit'>$1</span>");
    if (config.colorName) {
      let color = stringToHSL(name.innerHTML.replace(/\u200b/g,"").replace(/<.*/g, "").toLowerCase());
      name.style.color = color;
      name.closest("table").style.borderColor = color;
    }
  }  
}

/****************************
 * FORMATAGE ZONE D'ÉDITION *
 ****************************/

function formatEditCss() {
  return `
  #mesdiscussions div.edited>span {
    position         : relative;
    margin-left      : 18px;
    color            : #999;
  }
  #mesdiscussions div.edited>span.smart-edit {
    margin-right     : 18px;
  }
  #mesdiscussions div.edited>span.smart-edit:after {
    content          : ' ';
    background-image : url(https://forum-images.hardware.fr/themes_static/images/silk/edit.gif);
    width            : 16px;
    height           : 16px;
    right            : -18px;
    position         : absolute;
  }
  #mesdiscussions div.edited>span>a:before {
    content          : ' ';
    background-image : url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEvSURBVDjLY/j//z8DJZiBagZEtO8QAuKlQPwTiP/jwbuAWAWbARtXHrz1//efv//xgS0n74MMuQ3EbHADgBweIP7z99+//x++/fv/8tO//88+/vv/5P2//w/f/ft/782//7df/f1/5xXE8OoFx0GGmCEbIJcz9QBY8gVQ47MP//4/Bmp+8Pbf/7tQzddf/P1/9RnEgM5VZ0EGeGM14ClQ86N3UM2v//2/9RKi+QpQ88UnuA2AewHk/PtAW++8/vv/JlDzted//18Gar7wBGTAH7ABtYtOgAywxBqIIEOQAcg1Fx7/BRuMFoicuKLxDyzK5u64Cjfo/ecfYD5Q/DLWaMSGgQrvPH/3FabxOxDXEp0SgYp7Z267AtL4BYgLSUrKQA1KQHwPiFPolxcGzAAA94sPIr7iagsAAAAASUVORK5CYII=);
    width            : 16px;
    height           : 16px;
    left             : -16px;
    position         : absolute;
  }
  `
};

/* Formatter la zone d'édition et la zone de nombre de citation d'un message */
function formatEdit(node) {
  for (const element of node.querySelectorAll(".message .edited")) {
    const quote = /cité (\d+) fois/g.exec(element.innerHTML);
    const name  = element.parentNode.parentNode.parentNode.querySelector("b.s2").innerHTML.replace(/\u200b/g, "").toLowerCase();
    let edited  = /édité par (.+) le (\d\d-\d\d-\d\d\d\d)&nbsp;à&nbsp;(\d\d:\d\d):\d\d/g.exec(element.innerHTML);
    let url;
    if (quote) url = element.querySelector("a").href;
    if (edited) {
      edited[1] = (name == edited[1].toLowerCase()) ? "" : `(${edited[1]}) `;
      edited[2] = smartDate(edited[2].replace(/-/g,"/"));
      element.innerHTML = `<span class ="smart-edit">${edited[1]}${edited[2]}${edited[3]}</span>`;
    } else {
      element.innerHTML = "";
    }
    element.innerHTML += (quote) ? `<span><a class ="cLink" href = "${url}" rel="nofollow">${quote[1]}</a></span>` : "";
  }  
}
/**********************
 * FORMATAGE SPOILERS *
 **********************/

function formatSpoilerCss() {
  return `
  #mesdiscussions table.spoiler td>br, #mesdiscussions table.spoiler .s1Topic>span {
    display : none;
  }

  #mesdiscussions table.spoiler .s1Topic {
    text-decoration : none;
  }

  #mesdiscussions table.spoiler {
    margin           : 8px 0 8px 0;
    width            : auto;
    max-width        : 90%;
    background-color : rgb(0,0,0,0);
  }
  `
};

/* Formatter les spoilers */
function formatSpoiler(node) {
  for (const spoiler of node.querySelectorAll("table.spoiler")) {
    let title = spoiler.querySelector(".s1Topic");
    if (title) title.innerHTML = title.innerHTML.replace(" :","<span> :</span>");
  } 
}

/*************************
 * PAGE DE CONFIGURATION *
 *************************/

function configCss() {
  return `
  .hfr-chat-config {
    display : none;
    border-spacing : 0px;
  }
  .hfr-chat-config input[type='checkbox'] {
    margin : 3px 0px 0px 0px;
  }
  #mesdiscussions .hfr-chat-config .reponse {
    width      : 40px;
    text-align : center;
    padding    : 0px 2px 0px 0px;
  }
  #mesdiscussions .hfr-chat-submit {
    width  : 135px;
    margin : 2px 5px 2px 5px;
  }
  .hfr-chat-config input {
    width : 100%;
    border : 0;
  }
  .hfr-chat-config .profil {
    height : 21px;
  }
  .hfr-chat-config input::-webkit-outer-spin-button, .hfr-chat-config input::-webkit-inner-spin-button {
   -webkit-appearance: none;
   margin: 0;
  }
  .hfr-chat-config input[type=number] {
    -moz-appearance: textfield;
  }
  `
};

/* Ajouter un onglet en haut du sujet */
function addTab(title, id, icon, action) {
  let before = document.createElement("div");
  let after = document.createElement("div");
  let tab = document.createElement("a");
  let img = document.createElement("img");
  before.className = "beforonglet";
  after.className = "afteronglet";
  tab.className = "onglet";
  tab.style.cursor = "pointer";
  tab.addEventListener("mouseover", () => {
    before.className = "beforongletsel";
    tab.className = "ongletsel";
    after.className = "afterongletsel";
  });
  tab.addEventListener("mouseleave", () => {
    before.className = "beforonglet";
    tab.className = "onglet";
    after.className = "afteronglet";
  });
  tab.onclick = action;
  tab.id = id;
  img.src = icon;
  img.title = title;
  img.alt = title;
  
  let tabContainer = document.querySelector(".cadreonglet");
  tabContainer.appendChild(before);
  tabContainer.appendChild(tab).appendChild(img);
  tabContainer.appendChild(after);
}

/* Charger les paramètres actuels de la configuration */
function loadConfig() {
  for (const parameter of document.querySelectorAll(".hfr-chat-parameter")) {
    parameter.loadState();
  }
}

/* Charger les paramètres par défaut de la configuration */
function resetConfig() {
  for (const parameter of document.querySelectorAll(".hfr-chat-parameter")) {
    parameter.resetState();
  }
}

/* Sauvegarger les paramètres et recharger la page */
function saveConfig(reset) {
  for (const parameter of document.querySelectorAll(".hfr-chat-parameter")) {
    parameter.saveState();
  }
  config.version = VERSION;
  config.date = Date.now();
  
  GM.setValue("config",JSON.stringify(config));
  GM.setValue("useMPStorage",useMPStorage);
  if(useMPStorage) LocalMPStorage.setStorageData();
  
  applyCss();
  if (reset) setTimeout(() => location.reload(),config.refreshDelay);
}

/* Ouvrir la page de configuration */
function openConfig() {
  document.querySelector("#hfr-chat-config").onclick = closeConfig;
  for (const row of document.querySelectorAll("#mesdiscussions>table")) {
    row.style.display = "none";
  }
  for (const row of document.querySelectorAll(".hfr-chat-config, #mesdiscussions>.none")) {
    row.style.display = "table";
  }
}

/* Fermer la page de configuration */
function closeConfig() {
  document.querySelector("#hfr-chat-config").onclick = openConfig;
  for (const row of document.querySelectorAll("#mesdiscussions>table")) {
    row.style.display = "table";
  }
  for (const row of document.querySelectorAll(".hfr-chat-config")) {
    row.style.display = "none";
  }
}
  
/* Ligne de titre de la page de configuration */
function newHeaderRow(table, text, span) {
  let tr = table.insertRow();
  tr.className = "cBackHeader";
  let th = document.createElement("th");
  th.colSpan = span;
  th.innerText = text;
  tr.appendChild(th);
  return th;
}

/* Ligne de paramètre dans la page de configuration */
function newParameter(parameter, table, text, needReset, changeTracker) {
  let tr = table.insertRow();
  tr.className = "profil";
  let td = tr.insertCell();
  td.className = "reponse";
  let checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "hfr-chat-parameter";
  td.appendChild(checkbox);
  tr.insertCell().innerHTML = text;
  checkbox.loadState = () => checkbox.checked = config[parameter];
  checkbox.resetState = () => {
    if (DEFAULT_CONFIG[parameter] != config[parameter]) changeTracker.setReset();
    checkbox.checked = DEFAULT_CONFIG[parameter]; 
    return false
  };
  checkbox.saveState = () => config[parameter] = checkbox.checked;
  checkbox.oncontextmenu = checkbox.resetState;
  checkbox.onchange = changeTracker.setReset;
  return checkbox;
}

/* Ligne de valeur dans la page de configuration */
function newInput(parameter, table, text, changeTracker, min) {
  let tr = table.insertRow();
  tr.className = "profil";
  let td = tr.insertCell();
  td.className = "reponse";
  let input = document.createElement("input");
  input.className = "hfr-chat-parameter";
  input.type ="number";
  input.min = min;
  td.appendChild(input);
  tr.insertCell().innerHTML = text;
  input.loadState = () => input.value = config[parameter];
  input.resetState = () => {
    if (DEFAULT_CONFIG[parameter] != config[parameter]) changeTracker.setChange();
    input.value = DEFAULT_CONFIG[parameter]; 
    return false};
  input.saveState = () => config[parameter] = input.value;
  input.oncontextmenu = input.resetState; 
  input.oninput = changeTracker.setChange;
  return input;
}

/* Convertir une chaine rgb(x,x,x) en valeur hexadécimale */
function rgbToHex(string) {
  if (string == "" || /#[\da-f]{6}/i.test(string)) return string;
  let [r, g, b] = string.match(/[\d]+/g).map(x => parseInt(x));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/* Ligne de couleur dans la page de configuration */
function newColor(parameter, table, text, changeTracker, colorPicker) {
  let tr = table.insertRow();
  tr.className = "profil";
  let td = tr.insertCell();
  td.className = "reponse hfr-chat-parameter";
  td.onclick = () => {
    colorPicker.target = td;
    colorPicker.value = rgbToHex(td.style.backgroundColor);
    colorPicker.click();
  };
  td.loadState = () => td.style.backgroundColor = config[parameter];
  td.resetState = () => {
    if (DEFAULT_CONFIG[parameter] != rgbToHex(config[parameter])) changeTracker.setChange();
    td.style.backgroundColor = DEFAULT_CONFIG[parameter]; 
    return false};
  td.saveState = () => config[parameter] = rgbToHex(td.style.backgroundColor);
  td.oncontextmenu = td.resetState;
  tr.insertCell().innerHTML = text;
  return td;
}

/* Ligne de paramètre MPStorage */
function newUseMPStorage(table, text, needReset, changeTracker) {
  let tr = table.insertRow();
  tr.className = "profil";
  let td = tr.insertCell();
  td.className = "reponse";
  let checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "hfr-chat-parameter";
  td.appendChild(checkbox);
  tr.insertCell().innerHTML = text;
  checkbox.loadState = () => checkbox.checked = useMPStorage;
  checkbox.resetState = () => {
    if (!useMPStorage) changeTracker.setReset();
    checkbox.checked = true; 
    return false
  };
  checkbox.saveState = () => useMPStorage = checkbox.checked;
  checkbox.oncontextmenu = checkbox.resetState;
  checkbox.onchange = changeTracker.setReset;
  return checkbox;
}

/* Bouton dans la page de configuration */
function newSubmit(parent, text, onClickFunction) {
  let button = document.createElement("input");
  button.type = "submit";
  button.className = "hfr-chat-submit";
  button.value = text;
  button.onclick = onClickFunction;
  parent.appendChild(button);
  return button;
}

/* Créer la page de configuration */ 
function createConfig() {
  // Objet permettant de suivre les modifications
  let changeTracker = {
    reset          : false,
    validateButton : null,
    resetButton    : null,
    cancelButton   : null,
    setChange() {
      changeTracker.validateButton.disabled = false;
      changeTracker.cancelButton.disabled = false;
    },
    setReset() {
      changeTracker.setChange();
      changeTracker.reset = true;
      changeTracker.validateButton.value = "Valider & Recharger";
    },
    undoChange() {
      changeTracker.reset = false;
      changeTracker.validateButton.disabled = true;
      changeTracker.cancelButton.disabled = true;
      changeTracker.validateButton.value = "Valider";
    }
  };
  // Interface de sélection de couleur
  let colorPicker = document.createElement("input");
  colorPicker.type = "color";
  colorPicker.onchange = () => {
    colorPicker.target.style.background = colorPicker.value;
    changeTracker.setChange();
  };
  // Tableau des paramètres
  let parameters = document.createElement("table");
  document.querySelector("#mesdiscussions").insertBefore(parameters, document.querySelector("#mesdiscussions>.main"));
  parameters.className = "main hfr-chat-config";
  newHeaderRow(parameters, "Configuration du script [HFR] Chat", 2);
  newParameter("formatLayout"   , parameters, "Habillage général modifié", false, changeTracker);
  newParameter("hideToolbar"    , parameters, "Barre d'outil masquée", false, changeTracker);
  newParameter("formatAvatar"   , parameters, "Avatars reformatés", false, changeTracker);
  newParameter("hideBorders"    , parameters, "Masquer les bords latéraux du tableau des messages", false, changeTracker);
  newInput(    "forumWidth"     , parameters, "Largeur du tableau des messages en pixels", changeTracker, 200);
  newInput(    "profileWidth"   , parameters, "Largeur de la colonne de profil en pixels", changeTracker, 0);
  newInput(    "avatarWidth"    , parameters, "Largeur des avatars en pixels", changeTracker, 0);
  newInput(    "toolbarDelay"   , parameters, "Délai en ms avant l'apparition de la barre d'outil au passage de la souris", changeTracker, 0);
  newInput(    "refreshDelay"   , parameters, "Délai en ms avant le rechargement de la page après validation des paramètres", changeTracker, 0);
  newInput(    "moodStatusDelay", parameters, "Délai en ms avant la disparition des informations d'un profil au passage de la souris", changeTracker, 0);
  newColor(    "pageBackground" , parameters, "Couleur du fond de la page (derrière le tableau des messages)", changeTracker, colorPicker);
  newColor(    "forumBackground", parameters, "Couleur du fond du tableau des message", changeTracker, colorPicker);
  newColor(    "toolbarColor"   , parameters, "Couleur du texte de la barre d'outils", changeTracker, colorPicker);
  newHeaderRow(parameters, "Paramètres nécessitant un rechargement de la page", 2);
  newParameter("moveProfile"    , parameters, "Information du profil dans la barre d'outil", true, changeTracker);
  newParameter("addAvatar"      , parameters, "Avatars pour les membres qui n'en ont pas", true, changeTracker);
  newParameter("colorName"      , parameters, "Pseudos colorés", true, changeTracker);
  newParameter("formatQuote"    , parameters, "Citations dans les messages reformatées", true, changeTracker);
  newParameter("formatDate"     , parameters, "Dates compactes", true, changeTracker);
  newParameter("formatEdit"     , parameters, "Zones d'indication d'édition et de citation compactes", true, changeTracker);
  newParameter("formatSpoiler"  , parameters, "Spoilers compacts", true, changeTracker);
  newParameter("observe"        , parameters, "Traiter les messages ajoutés dynamiquement à la page par d'autres scripts", true, changeTracker);
  newUseMPStorage(parameters, "Utiliser MPStorage avec ce navigateur", true, changeTracker);
  let submitRow = newHeaderRow(parameters, "", 2);
  changeTracker.validateButton = newSubmit(submitRow, "Valider", () => {
    saveConfig(changeTracker.reset);
    changeTracker.undoChange();
  });
  changeTracker.resetButton = newSubmit(submitRow, "Réinitialiser", () => {
    changeTracker.undoChange();
    resetConfig();
  });
  changeTracker.cancelButton = newSubmit(submitRow, "Annuler", () => {
    loadConfig();
    changeTracker.undoChange();
  });
  newSubmit(submitRow, "Retour", closeConfig);
  
  loadConfig();
  changeTracker.undoChange();
}  

/*************
 * ÉXÉCUTION *
 *************/

/* Appliquer les modifications du script à un message */
function customize(node) {
  if (config.addAvatar)     addAvatar(node);
  if (config.colorName)     colorName(node);
  if (config.formatDate)    formatDate(node);
  if (config.moveProfile)   moveProfile(node);
  if (config.formatQuote)   formatQuote(node);
  if (config.formatEdit)    formatEdit(node);
  if (config.formatSpoiler) formatSpoiler(node);
}

/* Ajouter un observateur pour traiter les messages ajoutés par d'autres scripts */
function activateObserver(action) {
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const message of mutation.addedNodes) {
        action(message);
      }
    }
  }).observe(document.getElementById("mesdiscussions"), {childList: true});
}

/* Appliquer les modifications du script à la page */
function applyScript() {
  createConfig();
  addTab("Configurer [HFR] Chat","hfr-chat-config", 
         "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJeSURBVDjLpZNLSNRRFIe/O81o+WjISM0epuarEHuDqIFEDyoqEFtFD4gWQVDQoo0QhFARbowKNNpKi0DJRYVGqRmY5oPUBs3S1GnMcdR0/v8Z554WM44RGURne7nf+X6cc5SI8D9lBTh79/0VIBkoAHaCCIJCCxaLwqJAa40O4LFZpT9z/cpdaOFqcZZCRDhT0V4p/1i3HveIiAQNgEKAh83usNrfgp3Pj6NvyGOGI6AlceExPT4SAKX+/PnjNxMAr+GPCANEJGqhq8NlLtk53myk0FlN/0QO19a+Ul33Lp4OArRYF9SWqrmxWqb7WliRcwp7ynY8g5n0Pa+6vQBQACXX6zG0RgvU3djP4OhUMI7nBXZ6iEvPxz3QS4TyEbsykZjVG+0hgAbgu9fPvm1J1LWNhDtH+1qxSRf21IOYY9VERCm+dPQxPatQvolcS8gAgBkjgF+EOXM+OImpZmw/GrCnHcYYrUTZJrHFxBItbh4N5bH70hOHBUCFDEzTj9cfIGD4cfbWEjX7GvvmYxgj97HY/PimN+Fq7GTNgTKchh2AoMEvUxeBnKgOPF+bid96BJ+zimURgjmdzHhTO6qonOUJ2YjMLwL0vA4ThluqKT0UwBdIYqy7Ao3BrHsdrre9qKJyVHQCodgSBgS0/gzQ/eAExWntbCm4QORwE46aZjqeuXG87GTD8TukZmSRkmQPmcrk4iYGdE1JaUOGiOTlulyrfB+ekpJbyNT4BANtDupjLzNe9g6R1lBIPQOWXgD1+zmf3Bvn3ZGaYN2TnYLYzDde1/i5oze7Pi21YD8BVSdMJ0n4cQkAAAAASUVORK5CYII="
         , openConfig);
  customize(document);
  if (config.observe) activateObserver(customize);
}

/* Ajouter une feuille de style au document */
function addCss(cssString) {
  let css = document.querySelector(".hfr-chat-css") || document.createElement("style");
  css.type = "text/css";
  css.className ="hfr-chat-css";
  css.innerHTML = cssString;
  document.head.appendChild(css);
}

/* Appliquer les feuilles de style à la page  */
function applyCss() {
  let style = configCss();
  
  if (config.formatLayout)  style += formatLayoutCss();
  if (config.formatQuote)   style += formatQuoteCss();
  if (config.formatEdit)    style += formatEditCss();
  if (config.hideToolbar)   style += hideToolbarCss();
  if (config.formatAvatar)  style += formatAvatarCss();
  if (config.addAvatar)     style += addAvatarCss();
  if (config.moveProfile)   style += moveProfileCss();
  if (config.formatSpoiler) style += formatSpoilerCss();
  
  if (document.head) {
    addCss(style);
  } else {
    new MutationObserver(function(mutations) {
      if (document.head) {
        this.disconnect();
        addCss(style);
      }
    }).observe(document.documentElement, {childList: true});
  }
}

/* Démarrer le script */
async function initialize() {
  // Chargement de la configuration locale
  const DEFAULT_STRING = JSON.stringify(DEFAULT_CONFIG);
  const STORED_STRING = await GM.getValue("config", DEFAULT_STRING);
  config = Object.assign(JSON.parse(DEFAULT_STRING), JSON.parse(STORED_STRING));
  
  // MPStorage n'est pas attendu pour appliquer les styles
  applyCss();
  
  // Chargement de la configuration via MPStorage
  await LocalMPStorage.initMPStorage();
  if (!LocalMPStorage.hfrChat) LocalMPStorage.setStorageData();
   
  useMPStorage = await GM.getValue("useMPStorage", true);
  if (useMPStorage && config.date < LocalMPStorage.hfrChat.config.date) {
    // Mettre à jour la configuration locale avec la configuration du MP
    config = Object.assign(config, LocalMPStorage.hfrChat.config);
    GM.setValue("config",JSON.stringify(config));
    location.reload();
  }

  // Le script est appliqué une fois le document chargé
  if (document.readyState != 'loading') {
    applyScript();
  } else {
    document.addEventListener('DOMContentLoaded', applyScript);
  }
}
