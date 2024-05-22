// Icons]
import { MdOutlinePix } from "react-icons/md";

function CheckoutPixContent() {
	return (
		<div className="flex flex-row justify-center items-center w-[350px] bg-primary px-2 py-1 gap-1 rounded shadow-md">
			<h1 className="select-none">Pague com Pix!</h1>
			<MdOutlinePix size={16} />
		</div>
	);
}

export { CheckoutPixContent };
