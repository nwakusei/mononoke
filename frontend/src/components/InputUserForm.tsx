// Hook Form
import { useForm } from "react-hook-form";

interface IInputFormProps {
	htmlFor: string;
	labelTitle: string;
	type: string;
	inputName: string;
	register: any;
	errors: any;
}

function InputUserForm({
	htmlFor,
	labelTitle,
	type,
	inputName,
	register,
	errors,
}: IInputFormProps) {
	const {
		formState: { touchedFields },
	} = useForm();

	return (
		<label className="form-control w-full max-w-xs" htmlFor={htmlFor}>
			<div className="label">
				<span className="label-text">{labelTitle}</span>
			</div>
			<input
				type={type}
				id={inputName} // Defina o ID do input
				className={`input input-bordered w-full max-w-xs ${
					errors[inputName] ? "input-error" : "input-success"
				}`}
				{...register(inputName)} // Registre o input usando o nome recebido
			/>
			<div className="label">
				{errors[inputName] && ( // Acesse os erros usando o nome do input
					<span className="label-text-alt text-red-400">
						{errors[inputName].message}
					</span>
				)}
			</div>
		</label>
	);
}

export { InputUserForm };
