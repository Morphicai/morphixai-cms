import { registerAs } from "@nestjs/config";
import { ConfigLoader } from "../system/oss/config/config-loader";

export default registerAs("storage", () => {
    return ConfigLoader.loadStorageConfig();
});
