import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

export default function DownloadButtons({items, format, callbacks}){
	const handleDownloadItems = e => setDownloadItems(+e.target.value);
	return (
		<div>
			download first
			<TextField value={items} onChange={callbacks.items} style={{width:80}} />
			items as 
			<ToggleButtonGroup
				exclusive
				value={format}
				onChange={callbacks.format}
			>
				<ToggleButton value="csv">csv</ToggleButton>
				<ToggleButton value="markdown">markdown</ToggleButton>
			</ToggleButtonGroup>
			: &nbsp;
			<Button
				variant="contained"
				onClick={callbacks.download}
			>
				download
			</Button>
		</div>
	);
}