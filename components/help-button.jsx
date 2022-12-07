import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import HelpIcon from '@mui/icons-material/Help';

export default function HelpButton({text, required = false}){
	return (
		<Tooltip title={text}>
			<IconButton style={{color: "var(--light1)"}}>
				<HelpIcon/>
			</IconButton>
		</Tooltip>
	);
}