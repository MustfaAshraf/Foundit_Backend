import CryptoJS from "crypto-js"
import { config } from '../config/env.js';


export const encrypt = (text) => {
    return CryptoJS.AES.encrypt(text, config.JWT.SECRET).toString()
}


export const decrypt = (chiphertext) => {
    const bytes = CryptoJS.AES.decrypt(chiphertext, config.JWT.SECRET)
    return bytes.toString(CryptoJS.enc.Utf8)
}