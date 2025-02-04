import 'dotenv/config';
import { cleanEnv, num, str } from 'envalid';

const cfg = cleanEnv(process.env, {
  FLAG_RELAY_PORT: num(),
  MONGO_API_URI: str(),
});

export default cfg;
