interface LoadingProps {
  message?: string;
}

function Loading({ message = "Loading..." }: LoadingProps) {
  return <div role="status" aria-label="Loading">{message}</div>;
}

export default Loading;
