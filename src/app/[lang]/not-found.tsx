import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container section not-found">
      <p className="eyebrow">404</p>
      <h1>This page drifted out to sea.</h1>
      <Link className="btn btn-primary" href="/">
        Back to the homepage
      </Link>
    </main>
  );
}
