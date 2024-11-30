
import { writeRawToCSV } from "../src/utils";
import {verifyAllowList } from"../src/verify-allow-list"
const main = async () => {
  try {
    const verifyRes = await verifyAllowList("data/allow_list.csv");
    console.log("verifyRes", verifyRes);
  } catch (error){
    console.log(error)
  }
};

main();