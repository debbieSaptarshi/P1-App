import { syncCampusCatalog } from '../src/campus/sync';

syncCampusCatalog()
  .then((result) => {
    console.log(JSON.stringify(result));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
