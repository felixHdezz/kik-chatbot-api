let util = require('util');
let http = require('http');
let Bot = require('@kikinteractive/kik');

const bodyParser = require('body-parser');
const request = require('request');
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = 'URl';

var Sync = require('sync');
var assert = require('assert');
var fs = require('fs');
var config = require('./config.js');
var dbGlob = null;
var debug = true;
var vars = {
    sessions: {}
};
try {
    var callerId = require('caller-id');
} catch (err) {
    debugPrint(null, 'caller-id was not present');
    callerId = null;
}

// Configure the bot API endpoint, details for your bot
let bot = new Bot(config);

function init() {
    MongoClient.connect(mongoUrl, function(err, db){
        if(err){
            debugPrint(err, null);
        }else{
            dbGlob = db;
            debugPrint(null, "Connected to mongodb");
        }
    });
    //update the configuration
    bot.updateBotConfiguration();

    //on startchatting  
    bot.onStartChattingMessage(startChatMessages);
    
    //listening messages type text
    bot.onTextMessage(HandlersMessages);
    
    // Set up your server and start listening
    let server = http
        .createServer(bot.incoming())
        .listen(process.env.PORT || 3010);
    //console.log(server);
    debugPrint(null, "Started kik server port "+server._connectionKey);
}

function startChatMessages(messages){
    //console.log(messages);
    var event = messages._state;
    if(event.body){
        console.log(event);
    }
}

function HandlersMessages(eventMessages) {
    try {
        var event = eventMessages._state;
        if (event.body) {
            handlerMessageNew(event);
        } else {
            debugPrint(null, "No hay mensaje que mostrar");
        }
    } catch (err) {
        debugPrint("Error : " + err, null);
    }
}

function getClient() {
    try {
        eval(fs.readFileSync('../client/code.js') + '');
        this.MessageHandler = MessageHandler;
        this.startChattingMessages = startChattingMessages;
    } catch (err) {
        debugPrint(err, null);
    }
}

function getSession(context, event, callback) {
    var userId = context.recipient.id;
    try {
        vars.sessions[userId] = new getClient();
    } catch (e) {
        vars.sessions[userId] = null;
        debugPrint(e, null);
    }
    callback(vars.sessions[userId]);
}

function initUserObject(event, callback) {
    var context = new Context(event);
    var evento = new Event(event);
    getSession(context, evento, function (session) {
        callback(context, evento, session);
    });
}

function handlerStartMessage(event){
    initUserObject(event, function(context, event, session){
        try{
            session.startChattingMessages(context, event);
        }catch(err){
            debugPrint(err, null);
        }
    });
}

function handlerMessageNew(event) {
    initUserObject(event, function (context, event, session) {
        try {
            session.MessageHandler(context, event);
        } catch (err) {
            debugPrint(err, null);
        }
    });
}

function Context(event) {
    var context = this;
    this.userId = event.from;
    this.chatId = event.chatId;
    this.userName = event.from;
    this.recipient = event.id;
    this.sendResponse = sendResponse;
}

function Event(event) {
    this.type = event.type;
    this.message = event.body;
}

function sendResponse(text) {
    var infMsg = {
        username : this.userName,
        chatid : this.chatId,
        id : this.recipient
    }
    var message = text;
    if (message.startsWith('{') || message.startsWith('[')) {
        message = JSON.parse(text);
        sendPayload(message, infMsg);
    } else {
        prepareMessageText(message, infMsg);
    }
}

function sendMedia(type, fileUrl, inf) {
    var msg = [{
        type : type,
        to: inf.username,
        picUrl : fileUrl,
        chatId : inf.chatid
    }];
    sendMessagesAll(msg);
}

function prepareMessageText(message, data){
    var exists = [{
        body: message,
        to: data.username,
        type :'text',
        chatId : data.chatid
    }];
    sendMessagesAll(exists);
}

function sendMessagesAll(message) {
    request.post({
        url: 'https://api.kik.com/v1/message',
        auth: {
            user: config.username,
            pass: config.apiKey
        },
        json: {
            "messages": message
        }
    }, function(err, req, rep){
        if(err){
            debugPrint(err, null);
        }else{
            debugPrint(null,"send messages text...");
        }
    });
}

function sennMessageBroadcast(message){
    request.post({
        url: "https://api.kik.com/v1/broadcast",
        auth: {
            user: config.username,
            pass: config.apiKey
        },
        json: {
            "messages": message
        }
    }, function(err, req, rep){
        if(err){
            debugPrint(err, null);
        }else{
            debugPrint(null,"send messages keyboard...");
        }
    });
}

function prepareSendMessage(message,inf){
    var exists = [{
        type:"text",
        to: inf.username,
        body: message.title,
        keyboards : message.kayboard,
        chatId : inf.chatid
    }];
    sennMessageBroadcast(exists);
}

function prepareSendMessageLink(type, message, info){
    var newInfoMsg = {
        chatId : info.chatid,
        type : "link",
        to : info.username
    };
    var newMsg = Object.assign(newInfoMsg,message);
    var msg =[newMsg];
    sendMessagesAll(msg);
}

function sendPayload(message, data) {
    if (message.type) {
        switch (message.type) {
            case 'picture':
                sendMedia(message.type, message.url, data);
                break;
            case 'video':
                sendMedia(message.type, message.url, data);
                break;
            case 'link':
                prepareSendMessageLink(message.type, message.payload, data);
                break;
            case 'sticker':
                break;
            case 'keyboard':
                prepareSendMessage(message.payload, data);
                break;
        }
    }
}

function debugPrint(err, message) {
    if (debug) {
        var msg = getTime();
        if (callerId) {
            if (callerId.getString()) {
                msg += callerId.getString() + ': ';
            } else {
                msg += 'anonymousFunction: ';
            }
        }
        if (err) {
            msg += 'Error occurred. ' + err;
        } else {
            msg += message;
        }
        console.log(msg);
    }
}

function getTime() {
    var now = new Date();
    return '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '] ';
}

//init kik
init();
