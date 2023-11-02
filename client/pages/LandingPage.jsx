import { Button } from "@mui/material";
import { Page, Text } from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import styles from "./LandingPage.module.css";
import { useNavigate } from "raviger";
import userImg from "../public/userImg.png";
import { useRecoilState } from "recoil";
import { serverKeyAtom } from "../recoilStore/store";
import useFetch from "../hooks/useFetch";

export default function LandingPage() {
  const navigate = useNavigate();
  const [serverKey, setServerKey] = useRecoilState(serverKeyAtom);
  const [isServerKeyValid, setIsServerKeyValid] = useState(false);
  const handleInput = (event) => {
    const input = event.target.value;
    setServerKey(input);
    if (input.length === 152) {
      console.log(input, input.length);
      setIsServerKeyValid(true);
    } else {
      setIsServerKeyValid(false);
    }
  };
  const postOptions = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ serverKey: serverKey }),
  };

  const getServerKey = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "GET",
  };
  const useDataFetcher = (initialState, url, options) => {
    const [data, setData] = useState(initialState);
    const fetch = useFetch();

    const fetchData = async () => {
      setData("loading...");
      const result = await (await fetch(url, options)).json();
      if ("serverKey" in result) {
        setData(result.serverKey);
      }
    };

    return [data, fetchData];
  };

  const [serverKeyPost, fetchServerKeyPost] = useDataFetcher(
    "",
    "/api/updateServerKey",
    postOptions
  );
  const [responseServerKey, fetchServerKey] = useDataFetcher(
    "",
    "/api/getServerKey",
    getServerKey
  );
  const handleSubmit = () => {
    fetchServerKeyPost();
    navigate("/templates");
  };

  useEffect(() => { // first time call upto not getting server key from backend
    if (serverKey.length == 0) {
      fetchServerKey();
      setServerKey(responseServerKey);
    }
  }, []);
  useEffect(() => {
    console.log("useEffect running on response");
    console.log("hi from landingPage line 79")
    console.log(`https://${appOrigin}`)
    console.log(responseServerKey);
    if (responseServerKey.length === 152) {
      console.log("if condition running", responseServerKey);
      navigate("/templates");
    }
  }, [responseServerKey]);

  return (
    <>
      <Page>
        <div className={styles.container}>
          <div className={styles.topHalf}>
            <img src={userImg} alt="userIcon" className={styles.userImg} />
            <Text id={styles.greeting} as="h1" variant="headingMd">
              Hi, Welcome!
            </Text>
          </div>
          <div className={styles.bottomHalf}>
            <Text id={styles.heading} variant="headingMd">
              Please enter your server key
            </Text>

            <input
              onChange={handleInput}
              type="text"
              value={serverKey}
              maxLength="152"
              className={styles.serverKeyInput}
              placeholder=" Enter Sever Key"
              size="small"
            ></input>
            <Button
              disabled={!isServerKeyValid}
              id={styles.submitBtn}
              variant="contained"
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </div>
        </div>
      </Page>
    </>
  );
}
