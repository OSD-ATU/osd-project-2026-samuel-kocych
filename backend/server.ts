import { app } from "./src/index";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, (error) => {
  if (error) {
    if (error instanceof Error) {
      console.error("Error starting server:", error.message);
    } else {
      console.error("Error starting server:", error);
    }

    process.exit(1); // Exit the process with an error code
  } else {
    console.log("Server is running on port", PORT);
  }
});
