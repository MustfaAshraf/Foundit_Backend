import { v2 as cloudinary } from "cloudinary"
import { config } from './env.js';


cloudinary.config( {
    cloud_name : config.CLOUDINARY.CLOUD_NAME || "dm5clrtj3" ,
    api_key : config.CLOUDINARY.API_KEY|| 841366276643431 ,
    api_secret : config.CLOUDINARY.API_SECRET || "Ey91snGKogsQmWoWPX5HiBdx3CU" 
} )

export default cloudinary