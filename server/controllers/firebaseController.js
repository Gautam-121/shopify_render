import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
import Cryptr from "cryptr";
import SessionModel from "../models/SessionModels.js";
import readJsonlFile from "../utils/retiveJsonFile.js"
import downloadJsonlFile from "../utils/downLoadJsonFile.js";



const cryption = new Cryptr(process.env.ENCRYPTION_STRING);

export const getServerKey = async (req, res) => {

  try {

    const shop = req.query.shop;
    const [, sessionDetail] = await SessionModel.findAll({ where: { shop: shop } });

    if (!sessionDetail || !sessionDetail.serverKey) {
      return res
        .status(404)
        .json({ success: false, error: "Server key not found" });
    }

    const serverKey = sessionDetail.serverKey;

    return res.status(200).json({
      success: true,
      serverKey: serverKey
    });

  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

export const updateServerKey = async (req, res) => {

  try {

    const { serverKey } = req?.body
    const shop = req?.query?.shop;

    if (!serverKey) {
      return res.status(400).json({
        success: false,
        message: "Server Key missing"
      })
    }

    const storeData = await SessionModel.update(
      {
        serverKey: serverKey
      },
      {
        where: { shop: shop }
      }
    )

    if (!storeData) {
      return res.status(400).json({
        success: false,
        message: "Failure to update ServerKey"
      })
    }

    res.cookie('serverKeyPresent', true );

    return res.status(200).json({
      success: true,
      message: "ServerKey set Succeessufull"
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  };
};

export const sendNotification = async (req, res) => {

  try {

    const shop = req.query?.shop;

    if (!shop) {
      return res.status(400).json({
        success: false,
        message: "No Shop Provided"
      })
    }

    const [, sessionDetail] = await SessionModel.findAll({ where: { shop: shop } })

    if (sessionDetail === null) {
      return undefined;
    }
    if (sessionDetail.content.length == 0) {
      return undefined;
    }

    const { accessToken } = JSON.parse(cryption.decrypt(sessionDetail.content));

    const shopifyGraphQLEndpoint = `https://${shop}/admin/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`;

    const { title, body, segments: { name, id }, click_action } = req.body?.notificationMessage;

    if (!title || !body || !name || !id) {
      return res.status(400).json({
        success: false,
        message: "Please Provide title message and selected Segment",
      });
    }

    // Set up the Axios request config for shopify
    const axiosShopifyConfig = {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token":  "shpua_e55e359a3171a2a377c9f85d0de22cf6" || accessToken, // remove static value add because we haven't access of user
      },
    };

    // Set up the Axios request config for firebase
    const axiosFirebaseConfig = {
      headers: {
        Authorization: `key=${sessionDetail.serverKey}`,
        "Content-Type": "application/json",
      },
    };

    const topicName = name.replace(/\W+/g, '_'); // Replace non-alphanumeric characters with underscores

    const customerSegmentBulkQuery = `
   mutation {
   bulkOperationRunQuery(
   query: """
   {
    customerSegmentMembers(
        first: 100
        segmentId: "${id}"
    ) {
        edges {
            node {
            firstName
            metafield(key: "custom.firebase_token") {
              key
              value
            }

            }
        }
    }
   }
    """
  ) {
    bulkOperation {
      id
      status
    }
    userErrors {
      field
      message
    }
  }
    }`

    const customersBulkIdResponse = await axios.post(shopifyGraphQLEndpoint, { query: customerSegmentBulkQuery }, axiosShopifyConfig);

    const operationId = (customersBulkIdResponse?.data?.data?.bulkOperationRunQuery?.bulkOperation?.id) + ""

    // Define a function to check the status of the bulk operation
    const checkOperationStatus = async (operationId) => {
      const statusQuery = `
    {
      node(id: "${operationId}") {
        ... on BulkOperation {
          status
        }
      }
    }
  `;

      const statusResponse = await axios.post(
        shopifyGraphQLEndpoint,
        { query: statusQuery },
        axiosShopifyConfig
      );

      return statusResponse.data.data.node.status;
    };

    // Check the status of the bulk operation in a loop
    let operationStatus = await checkOperationStatus(operationId);

    while (operationStatus === 'RUNNING') {
      // Add a delay before checking the status again
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check the status again
      operationStatus = await checkOperationStatus(operationId);
    }

    // Continue to retrieve the URL
    const operationQuery = `{
    node(id: "${operationId}") {
    ... on BulkOperation {
      url
      partialDataUrl
      errorCode
      status
    }
  }
}
`;

    //Execute the GraphQL query for operation details
    const operationResponse = await axios.post(
      shopifyGraphQLEndpoint,
      { query: operationQuery },
      axiosShopifyConfig
    );

    const operationUrl = operationResponse?.data?.data?.node?.url;

    //Destination of dowloadJsonFile
    const destination = 'bulk-data.jsonl';

    await downloadJsonlFile(operationUrl, destination)

    //Read FirebaseTokens from dowloadedJson File
    let firebaseTokens = await readJsonlFile(destination)

    firebaseTokens = ["dLPRXoI3nkyeq8s0LiEGjA:APA91bFvWdu3yBpKMRAr1BDacTvF9P9Bk6zjHVqvLLhyOi_KkFmwAyeEkus4w20dkXdY68bEPric-37etPPOBniQeX4UOSCiWRlQE-MZfEPmCWmn4nh8TCg00tbtS6ovflbmg_UW4HJT"] // remove this line as well when you get firebaseToken attached with server key

    const subscribeTopic = await axios.post(
      "https://iid.googleapis.com/iid/v1:batchAdd",
      {
        to: `/topics/${topicName}`,
        registration_tokens: firebaseTokens,
      },
      axiosFirebaseConfig
    );

    if (subscribeTopic?.data?.results?.error) {
      return res.status(401).json({
        success: false,
        message: `${createTopic?.data?.results?.error} fireabseToken are not linked to your serverKey `
      })
    }

    const sendMessage = {
      notification: {
        body: body,
        title: title,
      },
      to: `/topics/${topicName}`,
    };

    if (click_action) {
      sendMessage.notification["click_action"] = click_action
    }

    console.log("click action", sendMessage.notification["click_action"])

    //axios request for sendingPushNotification
    const sendNotification = await axios.post(
      "https://fcm.googleapis.com/fcm/send",
      sendMessage,
      axiosFirebaseConfig
    );

    //Handle Error Edge case if serverKey is Invalid or message Not Send
    if (sendNotification?.data?.failure === 1) {
      return res.status(400).json({
        success: false,
        message: "Notification Not Send"
      })
    }

    await axios.post(
      "https://iid.googleapis.com/iid/v1:batchRemove",
      {
        to: `/topics/${topicName}`,
        registration_tokens: firebaseTokens,
      },
      axiosFirebaseConfig
    );

    return res.status(200).json({
      success: true,
      message: "Notification Send Successfylly",
    });

  } catch (error) {
    return res.status(500).json({
      success: false, message: error.message, statusCode: error.response?.status,
      data: error.response?.data
    });
  };
}




