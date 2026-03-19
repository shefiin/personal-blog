import { ImSpinner2 } from "react-icons/im";

type SpinnerProps = {
  className?: string;
};

const Spinner = ({ className = "h-4 w-4" }: SpinnerProps) => {
  return <ImSpinner2 className={`animate-spin ${className}`} aria-hidden="true" />;
};

export default Spinner;
