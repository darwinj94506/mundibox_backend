/**
 * Created with JetBrains WebStorm.
 * User: santiago
 * Date: 16/09/13
 * Time: 20:37
 * To change this template use File | Settings | File Templates.
 */


// var config = {

// 	api_root_url: 'https://api.mercadolibre.com',
// 	skd_version: '0.0.14',
// 	auth_url: 'https://auth.mercadolibre.com/authorization',
// 	oauth_url: 'https://api.mercadolibre.com/oauth/token',
// 	client_id :  process.env.App_ID,
// 	secret_key : process.env.Secret_Key,
// 	redirect_uri : process.env.Redirect_URI,
// 	site_id : 'MLA'
// };
// redirect_uri : 'https://powerful-beach-49426.herokuapp.com',

var config = {
	api_root_url: 'https://api.mercadolibre.com',
	skd_version: '0.0.14',
	auth_url: 'https://auth.mercadolibre.com.ec/authorization',
	oauth_url: 'https://api.mercadolibre.com/oauth/token',
	client_id :  '146821082450527',
	secret_key : 'VBM5frKS6Y9QK0swiJ4sW0LXUGU8im1G',
	redirect_uri : 'http://localhost:3002/api/subidaMasiva',
	site_id : 'MEC'
};

exports.config = config;
