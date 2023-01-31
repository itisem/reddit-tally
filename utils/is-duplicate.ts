import {distance} from "fastest-levenshtein";

export default function isDuplicate(allOrders, otherEntry, errorThreshold){
	return !allOrders.every(x => distance(x, otherEntry) > errorThreshold);
}