
import { writeRawToCSV } from "../src/utils";
import {fetchAllCsvRecords } from"../src/fetchAllCsvRecords"
const main = async () => {
  try {
    const rawEntries = await fetchAllCsvRecords();
    await writeRawToCSV("raw-burners.csv", rawEntries);
  } catch (error){
    console.log(error)
  }
  

};

main();
