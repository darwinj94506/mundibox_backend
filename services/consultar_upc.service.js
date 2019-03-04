const https = require('https')


exports.buscarUPC=function(upc,next){
    // console.log('UPC:',upc);
    // var pathInicial='/prod/trial/lookup?'+upc;
    // var pathInicial='/prod/trial/lookup'
    console.log("estoy en la funcion");
    var options = {
        hostname: 'api.upcitemdb.com',
        path: '/prod/trial/lookup',
        method: 'POST',
        headers: {
          "Content-Type": "application/json"  
        }
      }

    invocarServicio(upc,options, function (err,result) {
        if (err) {
            console('aqui');
            console.log(err);
             return JSON.parse(err);
            // next(null, err);
        }
         console.log("RESULTADO:",JSON.parse(result));
         return JSON.parse(result);
    });

}

//************************************************************************************* */
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
//*************************************************************************************** */

    // var req = https.request(opts, function(res) {
    // console.log('statusCode: ', res.statusCode);
    // console.log('headers: ', res.headers);
    // res.on('data', function(d) {
    //     console.log('BODY: ' + d);
    // })
    // })
    // req.on('error', function(e) {
    // console.log('problem with request: ' + e.message);
    // })
    // req.write('{ "upc": "4002293401102" }')
    // req.end()
    
  