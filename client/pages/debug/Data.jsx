import { Page } from "@shopify/polaris";
import { useNavigate } from "raviger";
import { useEffect, useState } from "react";
import LandingPage from "../LandingPage";
import { useRecoilState, useSetRecoilState } from "recoil";
import { dataFromApiAtom, segmentsDataAtom, serverKeyAtom } from "../../recoilStore/store";
import CircularProgress from '@mui/material/CircularProgress';
import { useDataFetcher } from "../../utils/services";


const GetData = () => {
  const [isLoaderVisible, setIsLoaderVisible] = useState(false)
  const [setProducts] = useSetRecoilState(dataFromApiAtom)
  const [serverKey, setServerKey] = useRecoilState(serverKeyAtom)
  const [setSegments] = useSetRecoilState(segmentsDataAtom)

  const navigate = useNavigate();
  const postOptions = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ text: "Body of POST request" }),
  };
  const getServerKey = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "GET",
  };
  const getSegment = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "GET",
  };
  const getProduct = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "GET",
  };
  const [responseProduct, fetchProduct] = useDataFetcher([], "/api/getProduct", getProduct);

  const [responseSegment, fetchSegment] = useDataFetcher(
    "",
    "/api/getSegment",
    getSegment
  );
  const [responseDataPost, fetchContentPost] = useDataFetcher(
    "",
    "api",
    postOptions
  );
  const [responseServerKey, fetchServerKey] = useDataFetcher(
    "",
    "/api/getServerKey",
    getServerKey
  );
  console.log(serverKey)
  useEffect(() => {
    if (serverKey === "") {
      fetchContentPost();
      fetchSegment();
      fetchServerKey();
      fetchProduct();
      setIsLoaderVisible(true)
    }
    else if (serverKey.length === 152) {
      navigate("/templates")
    }
  }, [serverKey]);
  useEffect(() => {
    setServerKey(responseServerKey)
  }
    , [responseServerKey])
  useEffect(() => {
    setSegments(responseSegment)
  },
    [responseSegment])
  useEffect(() => {
    setProducts(responseProduct)
  },
    [responseProduct])
  return (
    <>
      <Page>
        {isLoaderVisible ? (<CircularProgress color="inherit" />) : (<LandingPage />)}

      </Page>
    </>
  );
};

export default GetData;
