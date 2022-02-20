// Remote Example1 - controller
import { RelayServer } from "https://chirimen.org/remote-connection/js/beta/RelayServer.js";

window.getData = getData;
window.takeLaundry = takeLaundry;
window.hangLaundry = hangLaundry;
window.getWeather = getWeather;
window.getNoyaki = getNoyaki;

var channel;
onload = async function () {
  // webSocketリレーの初期化
  var relay = RelayServer("achex", "chirimenSocket");
  channel = await relay.subscribe("miyoshi");
  message.innerText = "achex web socketリレーサービスに接続しました\n";
  getData();
  getWeather();
  getNoyaki();
  channel.onmessage = getMessage;
};

function getMessage(msg) {
  // メッセージを受信したときに起動する関数
  var mdata = msg.data;

  if (mdata[0] === "GIVE SENSOR DATA") {
    var data = Number(mdata[1]);
    Wat.innerText = data;
    messageDate.innerText = "---";
    if (data < 20) messageDiv.innerText = "もう少し！！！\n";
    else if (data < 100) messageDiv.innerText = "まもなく乾きます！！！\n";
    else if (data < 200) messageDiv.innerText = "乾いてきた？？\n";
    else if (data < 300) messageDiv.innerText = "まだ，しめっています．．．\n";
    else if (data < 400)
      messageDiv.innerText = "ちょっっっっと乾いてきたかな！？\n";
    else messageDiv.innerText = "びしょびしょです．．．\n";
  } else if (mdata[0] === "TAKE IN LAUNDRY") {
    messageLaundry.innerText = "洗濯物が取り込まれました";
  } else if (mdata[0] === "HANG OUT LAUNDRY") {
    messageLaundry.innerText = "洗濯物が干されました";
  } else if (mdata[0] === "GIVE DATE") {
    var data = mdata[1];
    Wat.innerText = "-";
    messageDiv.innerText = "洗濯物が乾きました!!\n取り込んでください(;´∀｀)";
    messageDate.innerText = data;
  } else if (mdata[0] === "GIVE WEATHER") {
    Tem.innerText = Math.floor(Math.random() * 100);
    Hum.innerText = Math.floor(Math.random() * 100);
    Lum.innerText = Math.floor(Math.random() * 100);
  } else if (mdata[0] === "GIVE NOYAKI") {
    var x = Math.floor(Math.random() * 2);
    if (x === 0) Noy.innerText = "あり";
    else Noy.innerText = "なし";
  }
}

function getData() {
  // get microbit's internal sensor data
  // console.log("getData");
  channel.send("GET SENSOR DATA");
}

function takeLaundry() {
  // console.log("takeLaundry");
  channel.send("TAKE IN LAUNDRY");
  // messageLaundry.innerText = "洗濯物が取り込まれました";
}

function hangLaundry() {
  // console.log("hangLaundry");
  channel.send("HANG OUT LAUNDRY");
  // messageLaundry.innerText = "洗濯物が干されました";
}

function getWeather() {
  //console.log("getWeather");
  channel.send("GET WEATHER");
}

function getNoyaki() {
  channel.send("GET NOYAKI");
}