const SubizWebPhone = require("@subiz/wsclient/webphone.js");

let webphone;
var mycallid = "x";
let accid;
let eventLogs = {};

// setTokenStatus renders whether token is valid or invalid
function setTokenStatus(me) {
  let $tokenStatus = document.getElementById("tokenStatus");
  if (me == "loading") {
    $tokenStatus.innerHTML = "Đang kiểm tra";
    $tokenStatus.classList.add("text-muted");
    $tokenStatus.classList.remove("text-danger");
    $tokenStatus.classList.remove("text-success");
    return;
  }

  if (!me || !me.account_id) {
    $tokenStatus.innerHTML = "Token rỗng hoặc không hợp lệ. Vui lòng nhập lại";
    $tokenStatus.classList.remove("text-danger");
    $tokenStatus.classList.remove("text-success");
    $tokenStatus.classList.add("text-muted");
    return;
  }

  $tokenStatus.innerHTML = "Token hợp lệ. Xin chào " + me.fullname;
  $tokenStatus.classList.add("text-success");
  $tokenStatus.classList.remove("text-danger");
  $tokenStatus.classList.remove("text-muted");
}

function init() {
  setTokenStatus("loading");
  fetch(`https://api.subiz.com.vn/4.0/me?x-access-token=${access_token}`)
    .then((response) => {
      return response.json();
    })
    .then((me) => {
      setTokenStatus(me);
      if (!me || !me.account_id) return null;
      return me;
    })
    .then((me) => {
      if (!me) return;
      // save token
      try {
        webphone = new SubizWebPhone(access_token);
        accid = access_token.split("_")[0];
      } catch (e) {
        alert("ERROR2: " + e);
        // setTimeout(main)
        return;
      }

      document.getElementById("btnCall").disabled = false;

      webphone.onEvent(function (ev) {
        let call = ev.data.call_info;
        let callid = call.call_id;
        eventLogs[callid] = eventLogs[callid] || [];
        if (callid != mycallid) return;
        eventLogs[callid].push(ev);

        // render log
        let logM = eventLogs[callid];
        if (logM) {
          let log = logM
            .map((ev) => {
              return `${new Date(ev.created).toLocaleString()} | ${
                ev.type
              } | ${JSON.stringify(ev.data.call_info)}`;
            })
            .join("\n");
          document.getElementById("infoLog").innerHTML = log;
        }

        if (call.status == "dialing") {
          document.getElementById("infoRecordedUrl").innerHTML = "";
          document.getElementById("infoRecordedUrl").href = undefined;
          document.getElementById("info").style["background-color"] = "#fffed3";
        }

        if (call.status == "active") {
          document.getElementById("info").style["background-color"] = "#8cff6b";
        }

        if (call.status == "ended" || !call.status) {
          document.getElementById("info").style["background-color"] = "#ffc6c6";
        }

        if (call.status == "ended" && ev.id) {
          // from server, not fake
          document.getElementById("infoRecordedUrl").innerHTML = "Đang tải...";
          document.getElementById("infoRecordedUrl").href = undefined;

          fetchRecordedUrl(callid).then((url) => {
            if (url == "unavailable") {
              document.getElementById("infoRecordedUrl").innerHTML =
                "Không khả dụng";
              document.getElementById("infoRecordedUrl").href = undefined;
              return;
            }
            document.getElementById("infoRecordedUrl").innerHTML = url;
            document.getElementById("infoRecordedUrl").href = url;
          });
        }
      });
    });
}

// inputToken asks access token from the agent
function inputToken() {
  access_token = prompt("Vui lòng nhập access token");
  localStorage.setItem("access_token", access_token);
  if (access_token) init();
}

// fetchRecordedUrl attemps to get the recorded audio url
// since we dont know when the file is uploaded, we must retry multiple times.
// this code is only for demo purpose
function fetchRecordedUrl(callid) {
  // try maximum 4 times
  return new Promise((rs) => {
    fetchConversation(callid).then((convo) => {
      if (convo.call.recorded_audio && convo.call.recorded_audio.url) {
        return rs(convo.call.recorded_audio.url);
      }
      setTimeout(() => {
        fetchConversation(callid).then((convo) => {
          if (convo.call.recorded_audio && convo.call.recorded_audio.url) {
            return rs(convo.call.recorded_audio.url);
          }

          setTimeout(() => {
            fetchConversation(callid).then((convo) => {
              if (convo.call.recorded_audio && convo.call.recorded_audio.url) {
                return rs(convo.call.recorded_audio.url);
              }

              setTimeout(() => {
                fetchConversation(callid).then((convo) => {
                  if (
                    convo.call.recorded_audio &&
                    convo.call.recorded_audio.url
                  ) {
                    return rs(convo.call.recorded_audio.url);
                  }
                  rs("unavailable");
                });
              }, 4000);
            });
          }, 4000);
        });
      }, 4000);
    });
  });
}

// fetchConversation sends a request API to get the latest conversation
function fetchConversation(callid) {
  let call = webphone.getCall(callid);
  if (!call) return Promise.resolve(null);
  let convoid = call.conversation_id;
  if (!convoid) return Promise.resolve(null);
  return fetch(
    `https://api.subiz.com.vn/4.0/accounts/${accid}/conversations/${convoid}?x-access-token=${access_token}`
  ).then((response) => {
    return response.json();
  });
}

function makeCall() {
  if (!webphone) return;
  let fromNumber = document.getElementById("fromNumber").value;
  let toNumber = document.getElementById("toNumber").value;
  webphone.makeCall(toNumber, fromNumber);
  mycallid = webphone.getCurrentCallId();
}

let access_token = localStorage.getItem("access_token");
if (access_token) init();

// update loop
setInterval(function () {
  if (!webphone) return;
  let call = webphone.getCall(mycallid);
  if (!call) return;
  document.getElementById("infoCallId").innerHTML = call.call_id;
  document.getElementById("infoFromNumber").innerHTML = call.from_number;
  document.getElementById("infoConversationId").innerHTML =
    call.conversation_id;
  document.getElementById("infoToNumber").innerHTML = call.to_number;
  document.getElementById("infoStatus").innerHTML = call.status;
  document.getElementById("infoCreated").innerHTML = new Date(
    call.started
  ).toLocaleString();
  if (call.status == "active")
    document.getElementById("infoDuration").innerHTML =
      Math.floor((Date.now() - call.started) / 1000) || 0;
  else {
    document.getElementById("infoDuration").innerHTML =
      Math.floor((call.ended - call.started) / 1000) || 0;
  }
  if (call.hangup_code)
    document.getElementById("infoHangupCode").innerHTML = call.hangup_code;
}, 500);

function hangupCall() {
  if (!webphone) return;
  webphone.hangupCall(mycallid);
}

// expose to window so we can call it in HTML
window.makeCall = makeCall;
window.hangupCall = hangupCall;
window.inputToken = inputToken;
