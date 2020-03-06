// ==UserScript==
// @name        [HFR] Chat
// @namespace   ddst.github.io
// @version     0.0.1
// @author      DdsT
// @description Personnalisation de l'affichage du forum
// @icon        https://www.hardware.fr/images_skin_2010/facebook/logo.png
// @URL         https://ddst.github.io/HFR_Chat/
// @downloadURL https://ddst.github.io/HFR_Chat/hfrchat.user.js
// @updateURL   https://ddst.github.io/HFR_Chat/hfrchat.meta.js
// @match       *://forum.hardware.fr/forum2*
// @match       *://forum.hardware.fr/hfr/*
// @grant       none
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

/************** TODO *****************
 * beaucoup
 *************************************/

const CSS_FORUM = `
body {
  background-color : #eee;
}
#mesdiscussions {
  background-color : #fff;
  max-width        : 1200px;
  border-radius    :    8px;
  padding          :   12px;
}
#mesdiscussions .messagetable td, #mesdiscussions table {
  border-left      : none;
  border-right     : none;
}
#mesdiscussions .messagetable>tbody>tr>td {
padding-top        : 12px;
padding-bottom     : 12px;
}
#mesdiscussions table.spoiler td>b.s1Topic, #mesdiscussions table.spoiler td>br {
  display          : none;
}
#mesdiscussions table.spoiler {
  margin           : 8px 0 8px 0;
  width            : auto;
  max-width        : 90%;
  background-color : rgb(0,0,0,0);
}
#mesdiscussions img {
  max-width        : 100%;
  transition       : max-width 0.5s ease 0.5s;
}\
#mesdiscussions img:hover {
  max-width        : 200%;
}
`;

/*** Déplacement des éléments de la case profil ***/
const CSS_PROFIL = `
#mesdiscussions .message b.s2 {
  padding-right    : 5px;
  color            : #000;
}
#mesdiscussions .messCase1 {
  width            : 50px;
}
#mesdiscussions .MoodStatus {
  border           : 1px solid rgb(0,0,0,0.2);
  padding          : 1px;
  margin-right     : 5px;
  vertical-align   : bottom;
  display          : none;
}
#mesdiscussions .MDStatus {
  padding          : 1px;
  margin-right     : 5px;
  color            : red;
}
#mesdiscussions .ct-button {
  float            : left;
}
#mesdiscussions .messCase2 {
  max-width        : 0;
  position         : relative;
  overflow-wrap    : break-word;
}
#mesdiscussions .avatar_center{
  position         : relative;
}
#mesdiscussions .avatar_center img {
  object-fit       : cover;
  border-radius    : 50%;
  height           : 50px;
  width            : 50px;
  max-width        : 50px;
  overflow         : visible;
}
#mesdiscussions .avatar_center img:hover {
  position         : absolute;
  left             : 0;
  z-index          : 2;
  border-radius    : 0;
  height           : auto;
  width            : auto;
  max-width        : 150px;
  max-height       : 100px;
  filter           : drop-shadow(0px 0px 2px #666);
  transition       : max-width 0.3s ease 0.5s, border-radius 0.1s ease 0s;
  background       : white;
}
#mesdiscussions .toolbar>span {
  float            : left;
}
#mesdiscussions .message .right {
  float            : none;
  display          : inline;
}
#mesdiscussions .message .toolbar {
  transition       : all 0.3s ease 0s;
  border-bottom    : none;
  color            : #999;
  display          : flex;
}
#mesdiscussions .message .toolbar img {
  opacity          : 1;
}
#mesdiscussions .toolbar>.left {
  opacity          : 0;
  transition       : all 0.5s ease 0.3s;
  flex-grow        : 1;
}
#mesdiscussions .toolbar>.left:hover {
  opacity          : 1;
}
`;

function moveProfile(node) {
  for (const profile of node.querySelectorAll("td.messCase1")) {
    let name = profile.querySelector("b.s2");
    let avatar = profile.querySelector(".avatar_center");
    let moodStatus = profile.querySelector(".MoodStatus");
    let mdStatus = profile.querySelector(".MDStatus");
    let colorTag = profile.querySelector(".ct-button");
    let divRight = profile.querySelector("div.right");
    let toolbar = profile.parentNode.querySelector(".toolbar");
    let iconBar = toolbar.querySelector(".left");
    let span = document.createElement("span");
    let date = document.createElement("span");
    if (name.innerHTML != "Publicité") date = extractDate(iconBar);
    if (name.innerHTML.replace(/\u200b/g, "") == "Modération") {
      name.style.color = "red";    
    } else if (name.innerHTML.replace(/\u200b/g, "") == "Profil supprimé") {
      name.style.color = "grey";       
    } else {
      name.style.color = stringToHSL(name.innerHTML.replace(/\u200b/g, "").toLowerCase());
    }
    if(colorTag) span.appendChild(colorTag);
    span.appendChild(name);
    if(mdStatus) span.appendChild(mdStatus);
    if(moodStatus) {
      span.appendChild(moodStatus);
      name.addEventListener("mouseover",() => {moodStatus.style.display = "inline-block"});
      name.addEventListener("mouseout",() => {moodStatus.style.display = "none"});
    } 
    if(avatar) profile.prepend(avatar);
    span.appendChild(date);
    toolbar.insertBefore(span, toolbar.firstChild);
    iconBar.insertBefore(divRight, iconBar.firstChild);
  } 
}

function extractDate(toolbar) {
  let span = document.createElement("span");
  let dateText = toolbar.innerHTML.match(/Posté le .{10}&nbsp;à&nbsp;.{8}&nbsp;&nbsp;/g)[0];
  let date = dateText.match(/\d\d-\d\d-\d\d\d\d/g)[0].replace(/-/g,"/");
  let time = dateText.match(/\d\d:\d\d:\d\d/g)[0];
  let shortTime = dateText.match(/\d\d:\d\d/g)[0];
  let day = smartDate(date);
  for (let i = 0; i < toolbar.childNodes.length; ++i) {
      let curNode = toolbar.childNodes[i];
      console.log(curNode.nodeValue);
      if ((curNode.nodeValue ? curNode.nodeValue : "").match(/Posté le .*/g)) {
          curNode.nodeValue = "";
      }
  }
  span.innerHTML = day + shortTime;
  span.onmouseover = () => {span.innerHTML = date + " à " + time};
  span.onmouseout = () => {span.innerHTML = day + shortTime};
  return span;
}

function smartDate(date){
  let todayDate = new Date();
  let yesterdayDate = ( d => new Date(d.setDate(d.getDate()-1)) )(new Date);
  let shortDate = date.match(/\d\d\/\d\d/g)[0];
  let sameYear = todayDate.getFullYear() == date.match(/\d\d\d\d/g)[0];
  let today = ("0" + todayDate.getDate()).slice(-2) + "/" + ("0"+(todayDate.getMonth()+1)).slice(-2)  + "/" + todayDate.getFullYear();
  let yesterday = ("0" + yesterdayDate.getDate()).slice(-2) + "/" + ("0"+(yesterdayDate.getMonth()+1)).slice(-2)  + "/" + yesterdayDate.getFullYear();
  let day = `${sameYear ? (yesterday == date) ? "Hier " : shortDate : date}  à `;
  if (today == date) day = "";
  return day;
}

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

/*** Formatage des citations ***/
const CSS_QUOTE = `
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
`;

function formatQuote(node) {
  for (const name of node.querySelectorAll("td.messCase2 table.citation b.s1>a")) {
    name.innerHTML = name.innerHTML.replace(" a écrit :","");
    let color = stringToHSL(name.innerHTML.replace(/\u200b/g, "").toLowerCase());
    name.style.color = color;
    name.parentNode.parentNode.parentNode.parentNode.parentNode.style.borderColor = color;
  }  
}

/*** Formatage de l'indicateur d'édition ***/
const CSS_EDIT = `\
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
`;

function formatEdit(node) {
  for (const element of node.querySelectorAll(".message .edited")) {
    const quote = /cité (\d+) fois/g.exec(element.innerHTML);
    const name  = element.parentNode.parentNode.parentNode.querySelector("b.s2").innerHTML.replace(/\u200b/g, "").toLowerCase();
    let edited  = /édité par (.+) le (\d\d-\d\d-\d\d\d\d)&nbsp;à&nbsp;(\d\d:\d\d):\d\d/g.exec(element.innerHTML);
    let url;
    if (quote) url = element.querySelector("a").href;
    if (edited) {
      edited[1] = (name == edited[1].toLowerCase()) ? "" : "(" + edited[1] + ") ";
      edited[2] = smartDate(edited[2].replace(/-/g,"/"));
      element.innerHTML = '<span class ="smart-edit">'+ edited[1] + edited[2] + edited[3] + '</span>';
    } else {
      element.innerHTML = "";
    }
    element.innerHTML += (quote) ? '<span><a class ="cLink" href = "' + url + '" rel="nofollow">' + quote[1] + '</a></span>' : '';
  }  
}


function formatSpoiler(node) {
  for (const name of node.querySelectorAll(".message table.spoiler")) {

  }  
}

const CSS_AVATAR =`
#mesdiscussions .avatar_center>div {
  width            : 50px;
  height           : 50px;
  border-radius    : 50%;
  color            : #fff;
  font-size        : 25px;
  font-weight      : bold;
  line-height      : 48px;
}
`;

function addAvatar(node) {
  for (const profile of node.querySelectorAll("td.messCase1")) {
    if (!profile.querySelector(".avatar_center")) {
      let name = profile.querySelector("b.s2");
      let div = document.createElement("div");
      let hue = stringToHue(name.innerHTML.replace(/\u200b/g, "").toLowerCase());
      div.className = "avatar_center";
      div.style = "clear:both";
      let img = document.createElement("div");
      //img.style.backgroundColor = "hsl(" + hue +",50%,60%)";
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
      profile.prepend(div);
    }
  }  
}

function stringToHue(string) {
    let hash = 0;
    if (string.length != 0) {
      for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
      } 
    }
    return hash % 360;
};

function customize(node) {
  if (document.body.id == "category__inside_topics__normal_topic") {
    addAvatar(node);
    moveProfile(node);
    formatQuote(node);
    formatEdit(node);
  }
}

function getMessage(node) {
  let message = node.parentNode;
    while(message && (!message.classList || message.classList[0] != "message")) {
      message = message.parentNode;
    }
  return message;
}

function addCss(cssString) {
  let css = document.createElement("style");
  css.type = "text/css";
  css.innerHTML = cssString;
  document.head.appendChild(css);
}

const STYLE = CSS_FORUM + CSS_PROFIL + CSS_QUOTE + CSS_EDIT + CSS_AVATAR;

if (document.head) {
  addCss(STYLE);
} else {
  new MutationObserver(function(mutations) {
    if (document.head) {
      this.disconnect();
      addCss(STYLE);
    }
  }).observe(document.documentElement, {childList: true});
}

/*
if (document.getElementById("mesdiscussions")) {
  customize(document);
} else {
  new MutationObserver(function(mutations) {
    if (document.getElementById("mesdiscussions")) {
      this.disconnect();
      customize(document);
    }
  }).observe(document.documentElement, {childList: true, subtree: true});
}
*/

document.addEventListener('DOMContentLoaded', () => {
  customize(document);
  if (document.body.id == "category__inside_topics__normal_topic") {   
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const message of mutation.addedNodes) {
          customize(message);
        }
      }
    }).observe(document.getElementById("mesdiscussions"), {childList: true});
  }
});