const urlModel = require("../models/urlModel");
const validUrl = require('valid-url');
const shortid = require('shortid');
const validation = require("../validation/validation");
const redis = require("redis");
const { promisify } = require("util");



//Connect to redis
const redisClient = redis.createClient
(
  14561,
  "redis-14561.c264.ap-south-1-1.ec2.cloud.redislabs.com",//Ip address
    { no_ready_check: true }
);
  redisClient.auth("tQnQbDllZyk4VKXs8dERcTtgQr9SjguR", function (err) //password empty
  {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () 
  {
    console.log("Connected to Redis..");
  });
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//------------------------1.Create URL---------------------------------------------------------

const createUrl = async function (req, res) 
{   
    try 
    {
      if (!validation.isValidReqBody(req.body)) 
        {    
           
            return res.status(400).send({ status: false, message: "Body data is missing" });
        }

        if (!validation.isValid(req.body.longUrl)) 
        {  
            return res.status(400).send({ status: false, message: "Please provide correct key value" })
        }
        if (typeof (req.body.longUrl) != 'string') 
        {

            return res.status(400).send({ status: false, message: "Numbers are not allowed" })
        }
        
        let longUrl = req.body.longUrl.trim() 
        if (validation.validhttpsLower(longUrl)) 
        {
            const regex = /^https?:\/\//
            longUrl = longUrl.replace(regex, "https://")
        }
        if (validation.validhttpsUpper(longUrl)) 
        {
            const regex = /^HTTPS?:\/\//
            longUrl = longUrl.replace(regex, "https://")
        }
        if (!validation.validateUrl(longUrl)) 
        {
            return res.status(400).send({ status: false, message: "Please provide valid URL" })
        }
        const baseUrl = 'http://localhost:3000'  

        if (!validUrl.isUri(baseUrl)) 
        {  
            return res.status(400).send({ status: false, msg: 'Invalid base URL' })
        }
        

        if (validUrl.isUri(longUrl)) 
        {
        
           let urlInfo1 = await GET_ASYNC(`${longUrl}`)
         
            if (urlInfo1) 
            {
                let urlInfo2=JSON.parse(urlInfo1)
                let urlInfo3={longUrl:urlInfo2.longUrl, shortUrl:urlInfo2.shortUrl, urlCode:urlInfo2.urlCode}
                return res.status(200).send({ status: true,message: "Data from the cache", data: urlInfo3 })
               
            } 
           
          
           else
            {

                const url = await urlModel.findOne({longUrl}).select({_id:0,longUrl:1, shortUrl:1, urlCode:1})
             
                if (url) 
                {
                    await SET_ASYNC(`${longUrl}`, JSON.stringify(url))
                    res.status(200).send({ status: true, msg: "Fetch from DB", data: url })
                }
                else
                {
                    const urlCode = shortid.generate().toLowerCase()
                    const shortUrl = baseUrl + '/' + urlCode

                 

                   let urlData = { longUrl, shortUrl, urlCode }
                    const details = await urlModel.create(urlData);
                    await SET_ASYNC(`${longUrl}`, JSON.stringify(details))
                    const resUrl = { longUrl: details.longUrl, shortUrl, urlCode }
                  res.status(201).json({ status: true, msg: "New Url create", data: resUrl })
                   
                }
              
              
            }
          
        }
        else 
        {
            return res.status(400).send({ status: false, msg: 'Invalid longUrl' })
        }
    }
    catch (error) 
    {

        return res.status(500).send({ status: false, message: error.message })
    }
 
}



//----------------------------------------2.Get Url---------------------------------------------------------------
const getUrl = async function (req, res) 
{
    try
    {
        const urlCode = req.params.urlCode;

        let cahcedProfileData = await GET_ASYNC(`${req.params.urlCode}`)
     
        if(cahcedProfileData) 
        {
            let cahcedProfileData1=JSON.parse(cahcedProfileData)
            return res.redirect(302, cahcedProfileData1.longUrl)
          
        }
         else
        {
         let url = await urlModel.findOne({urlCode:req.params.urlCode});
      
             if (!url) 
             {
                 return res.status(400).send({ status: false, message: "Url Not Found!!" })
             }
             else
             {
                await SET_ASYNC(`${req.params.urlCode}`,JSON.stringify(url))//redis take argument as string
               
                 return res.redirect(302, url.longUrl)
             }
         }
    }
    catch (error) 
    {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports = { createUrl, getUrl }