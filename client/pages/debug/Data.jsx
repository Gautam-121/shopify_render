import { Layout, LegacyCard, Page } from "@shopify/polaris";
import { useNavigate } from "raviger";
import { useEffect, useState } from "react";
import useFetch from "../../hooks/useFetch";
import LandingPage from "../LandingPage";
import { useRecoilState } from "recoil";
import { segmentsDataAtom, serverKeyAtom, dataFromApiAtom } from "../../recoilStore/store";
import CircularProgress from '@mui/material/CircularProgress';


const useDataFetcher = (initialState, url, options) => {
  const [data, setData] = useState(initialState);
  const [segmentsData, setSegmentsData] = useRecoilState(segmentsDataAtom);
  const [productsData, setProductsData] = useRecoilState(dataFromApiAtom)
  const fetch = useFetch();

  const fetchData = async () => {
    setData("");
    const result = await (await fetch(url, options)).json();
    if ("serverKey" in result) {
      setData(result.serverKey);
    } else if('segments' in result) {
      console.log(result)
      setData(result.segments);
      let dataFromApi = result.segments;
      setSegmentsData(dataFromApi);
    }
    else if('products' in result){
      setData(result.products);
      let dataFromApi = result.products;
      setProductsData(dataFromApi)
    }
  };

  return [data, fetchData,];
};

const GetData = () => {
  const [serverKey,setServerKey] = useState("")
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
  const [responseSegment, fetchSegment] = useDataFetcher(
    "",
    "/api/getSegment",
    getSegment
  );
  const [responseProducts, fetchProducts] = useDataFetcher(
    "",
    "/api/getProduct",
    getProduct
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
  useEffect(() => {
    fetchContentPost();
    fetchSegment();
    fetchServerKey();
    fetchProducts();
  }, []);
  useEffect(()=>{
setServerKey(responseServerKey)
  },[responseServerKey])
  useEffect(()=>{
    console.log("get Data:", responseServerKey, serverKey)
    console.log(`https://${appOrigin}`)
    console.log("hi from getData line 87")
if(responseServerKey.length===152||serverKey.length==152)
navigate("/createnotification")

  },[])
  return (
    <>
      <Page>
    {/* {isLoaderVisible ?<CircularProgress color="inherit"/>:<LandingPage />} */}
    <LandingPage/>
      </Page>
    </>
  );
};

export default GetData;
