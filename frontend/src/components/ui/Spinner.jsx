export default function Spinner({ large }) {
  return <span className={large ? "spinner spinner--lg" : "spinner"} aria-hidden />;
}
