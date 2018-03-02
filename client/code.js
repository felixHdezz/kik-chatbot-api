function MessageHandler(context, event){
    handlers.context = context;
    handlers.event =  event;
    if(event.type === "text"){
        var msg = event.message.toLowerCase();
        if(msg === "pictures"){
            var payload = {
                type : 'picture',
                url : 'https://s-media-cache-ak0.pinimg.com/736x/3e/c8/89/3ec889aa31e793cf94f3f7cc30646757.jpg'
            };
            context.sendResponse(JSON.stringify(payload));
            setTimeout(function(){
                context.sendResponse("Hola "+context.userName +"! bienvenido, yo soy un Bot en que te puedo ayudar?. :).");
            },950);
        } else if(msg === "keyboard") {
            var payload = {
                "type":'keyboard',
                payload : {
                    "title" : "Hola "+context.userName+"! como estas?",
                    "kayboard":[
                        {
                            "to": context.userName,
                            "type": "suggested",
                            "responses": [
                                {
                                    "type": "text",
                                    "body": "Bien :)"
                                },
                                {
                                    "type": "text",
                                    "body": "No muy bien :("
                                }
                            ]
                        }
                    ]
                }
            };
            context.sendResponse(JSON.stringify(payload));
        } else if(msg === "link" || msg === "hola"){
            var payload = {
                type: 'link',
                payload : {
                    title: "Pagina para crear tu propio bot",
                    text: "Este es una descripcion del link de la pagina",
                    url : 'https://dev.kik.com',
                    picUrl: "https://i.ytimg.com/vi/8rjj86cfaUo/maxresdefault.jpg",
                    attribution: {
                        name: "Link to page",
                        iconUrl: "https://www.teamspeak-bot.com/img/page-images/bot.png"
                    }
                }
            };
            context.sendResponse(JSON.stringify(payload));
            var payload = {
                "type":'keyboard',
                payload : {
                    "title" : "Bien, en que mas quieres que te ayude?",
                    "kayboard":[
                        {
                            "to": context.userName,
                            "type": "suggested",
                            "responses": [
                                {
                                    "type": "text",
                                    "body": "Pictures"
                                },
                                {
                                    "type": "text",
                                    "body": "keyboard"
                                }
                            ]
                        }
                    ]
                }
            };
            setTimeout(function(){
                context.sendResponse(JSON.stringify(payload));
            },1900);
        }else{
            context.sendResponse("Lo siento, no entendí tu mensaje :(. Podrias repetir de nuevo.");
        }
    }
}

var handlers = {
    showInit : function(type){
        /* CODE HERE */
    }
}
