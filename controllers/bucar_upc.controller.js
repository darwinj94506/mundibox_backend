var buscarUpcService=require('./../services/consultar_upc.service');
const https = require('https')
exports.buscarUPC = function(request, response) {

    // var respuesta=buscarUpcService.buscarUPC(req.body.upc);
    // console.log(respuesta);
    // res.status(200).json({respuesta});

    console.log("estoy en la funcion");
    var options = {
        hostname: 'api.upcitemdb.com',
        path: '/prod/trial/lookup',
        method: 'POST',
        headers: {
          "Content-Type": "application/json"  
        }
      }

    invocarServicio(request.body.upc,options, function (err,result) {
        if (err) {
            console('aqui');
            console.log(err);
             response.status(500).json(JSON.parse(err));
            // next(null, err);
        }
        //  console.log("RESULTADO:",JSON.parse(result));
         response.status(200).json(JSON.parse(result));
    });

};

function invocarServicio(upc,options,cb) {
    var body;
	 req =https.request(options, function(res) {
		res.on('data', function (data) {
            // Cada vez que se recojan datos se agregan a la variable
            // console.log("BODY:",JSON.parse(chunk));
            body=data;
        });
        res.on('end', function() {
            // console.log("end");
            // var result=JSON.parse(body);
            cb(null,body);
        });
        res.on('error',function(){
            console.log(error);
            cb(error,null);
        })
    })
    req.write(`{"upc":"${upc}"}`);
    req.on('error',cb);

    req.end();
}