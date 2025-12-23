import { z } from "zod";

export const storeApplySchema = z.object({
    restaurantName: z.string().min(1),
    ownerName: z.string().min(1),
    mobile: z.string().min(10),
    latitude: z.string(),
    longitude: z.string()
});