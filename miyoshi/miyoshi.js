import { requestI2CAccess } from "./node_modules/node-web-i2c/index.js";
import Neopixel from "@chirimen/neopixel-i2c";
import ADS1x15 from "@chirimen/ads1x15";
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
import nodeWebSocketLib from "websocket"; // https://www.npmjs.com/package/websocket
import { RelayServer } from "./RelayServer.js";

var channel;
var ads1115;
var neopixel;

let count = 0;
let kawaki_time;

const judge_count = 100;

main();

//　neopixelひとつずつ光らせる
function neo_turn_on(number, color) {
    neopixel.setPixel(number, color[0], color[1], color[2]);
}

//　neopixelひとつずつ消す
function neo_turn_off(number) {
    neopixel.setPixel(number, 0, 0, 0);
}

//　neopixel全て光らせる
function neoall_turn_on(color) {
    neopixel.setGlobal(color[0], color[1], color[2]);
}

//　neopixel全て消す
function neoall_turn_off() {
    neopixel.setGlobal(0, 0, 0);
}

//　neopixelを虹色に光らせる
function neo_niji() {
    neopixel.setPixel(0, 10, 10, 10);
    neopixel.setPixel(1, 15, 15, 0);
    neopixel.setPixel(2, 20, 10, 0);
    neopixel.setPixel(3, 15, 0, 15);
    neopixel.setPixel(4, 30, 0, 0);
    neopixel.setPixel(5, 0, 30, 0);
    neopixel.setPixel(6, 0, 15, 15);
    neopixel.setPixel(7, 0, 0, 30);
}

//　水分量検査（水分量が返り値）
async function read_water(){
    var value = await ads1115.read(0);
    channel.send(["GIVE SENSOR DATA",value]);
    //channel.send(value);
    return value;
}

//　水分量を引数に与えると，neopixelを棒グラフのように光らせる
function light(value){
    let color = [0, 0, 30];
    for (let i = 0; i < 8; i++) {
        if (value <= (2048 * i / 7)) neo_turn_on(i, color);
        else neo_turn_off(i);
    }
}

// 水分量と乾きカウントを引数に与えると，更新してくれる．（返り値は乾きカウント）
function judge_water(value,count){
    if (value<100) count++;
    else count=0;
    return count;
}

async function sub_water(){
    if (count < judge_count){
        // 水分量取得
        var value_water = await read_water();
        // neopixel棒グラフに光らせる
        light(value_water);
        // 乾きカウント
        count = judge_water(value_water,count)
    }

    else if (count === judge_count) {
        neo_niji();
        console.log(`finish`);
        var now = new Date();
        kawaki_time =now.getMonth()+1 + "月" +　now.getDate() + "日" + now.getHours() + "時" + now.getMinutes() + "分";
        channel.send(["GIVE DATE",kawaki_time]);
        count++;
    }

    else if(count > judge_count);
}

// メッセージが届いた際に動く関数     
async function transmitSensorData(messge) {
    //console.log(messge.data);
    if (messge.data == "GET SENSOR DATA") {
        // 乾いた後
        if (count >= judge_count){
            //console.log("kawaki");
            channel.send(["GIVE DATE",kawaki_time]);
        }
        // 乾く前．水分量送信
        else{
            //console.log("nure")
            var sensorData = await ads1115.read(0);
            channel.send(["GIVE SENSOR DATA",sensorData]);
        }
    }
    else if(messge.data == "TAKE IN LAUNDRY"){
        // 洗濯物を屋根内にいれる作業
        let color = [30,0,0];　// 仮取り込み作業
        neoall_turn_on(color);　// 仮取り込み作業
        //console.log("torikomi");
        channel.send(["TAKE IN LAUNDRY"]);
    }
    else if(messge.data == "HANG OUT LAUNDRY"){
        // 洗濯物干す作業(屋根外に出す作業)
        let color = [0,30,0];　// 仮干し作業
        neoall_turn_on(color);　// 仮干し作業
        //console.log("hosu");
        channel.send(["HANG OUT LAUNDRY"]);
    }
    else if(messge.data == "GET WEATHER"){
        channel.send(["GIVE WEATHER"]);
    }
    else if(messge.data == "GET NOYAKI"){
        channel.send(["GIVE NOYAKI"]);
    }
}

// メイン関数       
async function main() {
    const i2cAccess = await requestI2CAccess(); 
    const port = i2cAccess.ports.get(1); 

    ads1115 = new ADS1x15(port, 0x48); 
    await ads1115.init();

    neopixel = new Neopixel(port, 0x41);
    await neopixel.init();

    var relay = RelayServer("achex", "chirimenSocket", nodeWebSocketLib, "https://chirimen.org");
    channel = await relay.subscribe("miyoshi");
    console.log("achex web socketリレーサービスに接続しました");
    channel.onmessage = transmitSensorData;

    // 無限ループ
    while (true) {
        sub_water();
        await sleep(1000);
    }
}