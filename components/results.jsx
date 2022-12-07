import {DataGrid} from '@mui/x-data-grid';
import {useState, useEffect} from 'react';

export default function Results({results}){
	const [pageSize, setPageSize] = useState(50);
	const [titleWidth, setTitleWidth] = useState(250);
	const rows = Object.entries(results.entries).map(x => (
		{
			id: x[0],
			points: x[1].points,
			lists: x[1].lists
		}
	));
	const columns = [
		{field: "id", headerName: "entry", width: titleWidth},
		{field: "points", headerName: "points", width: 100},
		{field: "lists", headerName: "lists", width: 100},
	];
	useEffect(() => setTitleWidth(Math.min(Math.max(250, window.innerWidth - 250), 750)), []);
	return (
		<DataGrid 
			rows={rows}
			columns={columns}
			pageSize={pageSize}
			rowsPerPageOptions={[10,20,50,100,200,500,1000]}
			onPageSizeChange={s => setPageSize(s)}
			autoHeight
		/>
	);
}