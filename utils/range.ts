/** returns a list of numbers from 0 to n-1
 * @param {number} n - how many numbers to return
 */
export default function range(n: number): number[]{
	return [...Array(n).keys()];
}