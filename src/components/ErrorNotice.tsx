interface ErrorNoticeProps {
  message?: string;
}

export default function ErrorNotice({ message }: ErrorNoticeProps) {
  if (!message) return null;

  return <p className="error" role="alert">{message}</p>;
}
