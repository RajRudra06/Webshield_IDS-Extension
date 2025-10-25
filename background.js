import { continuousChecker } from "./helperFunctions/finalApplier";
import { installation } from "./helperFunctions/onInstall";
import { startup } from "./helperFunctions/onStartup";

let settings = { enabled: true };      

installation()
startup()
continuousChecker()
