# Telegram Fake Bot
 
This is used as an experiment.

This bot will proxy all messages to an administrator and when the administrator answers, it will be send back to the last user.

To be administrator:

 > /admin `Ymd`

To be a guest:
 
 > /start.

To leave as guest or administrator:
 
 > /stop


## Demo
Use ZalixBot <https://web.telegram.org/#/im?p=@Zalix_Bot>

## Installation
This script is meant to be used on AWS with AWS API and AWS Lamba.
You can get this repository using `git clone https://github.com/ragusa87/TelegramZalixBot-Lambda.git`
> run `npm install`

You can test the bot from the commandline using `npm run start`

## Deployment on AWS

We need to create:
- An S3 bucket for storage purpose (You can implement another backed if you want)
- A Lambda function with S3 permissions.
- An AWS API


### Create a new Bucket
- Name it ZalixBot-<something>.

### Create a new Lambda Function
- Create a new Lambda function from scratch named *ZalixBot*
- Select "create a Role from Template" and choose "S3 Object ReadOnly permission". We will edit this later.
- Add an environment variable on your Lambda function named `bucket` and type your bucket name.
- Update your Lamba function with the script `./build.sh` (you should have AWS-Cli or you can upload a zip instead).

### Create a new API Gateway
The endpoint with execute the Lambda function.
As we want to handle multiple bot instances with the same deployment,
we have to configure the lambda context to receive the "Telegram API Key" as a token from the URL.

1. Create a new AWS API Gateway named *ZalixBot*
2. On the API, create a new resource `/{token}`
3. Create a new POST method for the resource and set your lambda function.
4. Under `Method request` set the request paths `token` and add `Content-Type` to the HTTP request header.
5. Under `Integration request` set an URL Path parameter `token` to `method.request.path.token`
6. Still under `Integration request` set a "Body mapping template" to `application/json` and past the code below.
```
##  See http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html
##  This template will pass the token variable and context through to the integration endpoint via the body/payload
#set($allParams = $input.params())
{
"body-json" : $input.json('$'),
"params":
{
#set($queryMap = $input.params().path)

#foreach($key in $queryMap.keySet())
  "$key" : "$queryMap.get($key)"
  #if($foreach.hasNext),#end
#end
},
"context" : {
    "http-method" : "$context.httpMethod",
    "stage" : "$context.stage",
    "source-ip" : "$context.identity.sourceIp",
    "user-agent" : "$context.identity.userAgent",
    "request-id" : "$context.requestId"
    }
}

```
7. Deploy your API (and create a new stage *prod* if needed)

#### Add S3 access to your lambda function
- Under Lambda, click on your function and on the S3 icon. Then copy the Lambda Execution Role ARN.
- Under IAM, edit your role policy to add read and write access only to your bucket with the policy below. Be sure to replace <bucketName> with your bucket's name
```yml
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::<bucketName>/*"
        }
    ]
}
```


### Set a Telegram Webhook
You must define a Telegram webhook to receive messages.
You can create a bot and obtain an API key from The Bot father <https://t.me/BotFather>

To set a webhook use something like this:

> curl -F "url=https://%domain%/%apikey%" https://api.telegram.org/bot%apikey%/setWebhook

Your domain is the AWS API Endpoint, you can define something else using an API Custom domain name.

Examples:

<https://prod.zabixbot.example.com/YOUR-API-KEY-TOKEN> or <randomtoken.execute-api.eu-central-1.amazonaws.com/prod/YOUR-API-KEY-TOKEN>

## Licence
MIT
