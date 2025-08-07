import { Link } from "react-router"

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/">
        <p className="test-2xl font-bold text-gradient cursor-pointer">AI-RESUME-ATS</p>
      </Link>
      <Link to="/upload" className="primary-button w-fit cursor-pointer">
        Upload Resume
      </Link>
    </nav>
  )
}

export default Navbar
