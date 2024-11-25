const Footer = () => {
  return (
    <footer className="bg-white dark:bg-black py-10 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo/Brand Section */}
          <div className="mb-4 md:mb-0">
            <a
              href="/"
              className="text-2xl font-bold text-black dark:text-white"
            >
              Deploy<span className="text-blue-600">It</span>
            </a>
          </div>

          {/* Links Section */}
          <div className="flex space-x-6 text-gray-600 dark:text-gray-400">
            <a
              href="#about"
              className="hover:text-black dark:hover:text-white transition"
            >
              About
            </a>
            <a
              href="#services"
              className="hover:text-black dark:hover:text-white transition"
            >
              Services
            </a>
            <a
              href="#projects"
              className="hover:text-black dark:hover:text-white transition"
            >
              Projects
            </a>
            <a
              href="#contact"
              className="hover:text-black dark:hover:text-white transition"
            >
              Contact
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200 dark:border-gray-800"></div>

        {/* Social Media and Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-4 md:mb-0">
            © {new Date().getFullYear()} DeployIt. All Rights Reserved.
          </p>
          <div className="flex space-x-4">
            <a
              href="https://github.com/pmalu9211"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black dark:hover:text-white transition"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/prathamesh-malu-53655321a"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black dark:hover:text-white transition"
            >
              LinkedIn
            </a>
            <a
              href="mailto:pmalu9211@gmail.com"
              className="hover:text-black dark:hover:text-white transition"
            >
              Email
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
