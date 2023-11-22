import React, { Component } from "react";
import { Navbar, Nav } from "react-bootstrap";
import logo from "../logo.png";

export default class NavbarDiv extends Component {
    render() {
        return (
            <Navbar expand="lg" className="nav-menu" fixed="top">
                <Navbar.Brand href="#home" className="ms-3">
                    <img
                        src={logo}
                        width="50"
                        height="50"
                        className="d-inline-block align-top"
                        alt="Codecraft"
                    />
                    <span className="brand-text">Bakerman</span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" className="me-3" />
                <Navbar.Collapse
                    id="basic-navbar-nav"
                    className="justify-content-end me-3"
                >
                    <Nav>
                        <Nav.Link className="me-5 ms-5" href="#home">
                            Home
                        </Nav.Link>
                        <Nav.Link className="me-5 ms-5" href="https://wa.me/+6285156020535">
                            Contact
                        </Nav.Link>
                        <Nav.Link className="me-5 ms-5" href="https://profile.zenoskie.tech/" target="blank">
                            About Me
                        </Nav.Link>
                        <Nav.Link className="me-5 ms-5" href="https://github.com/ridwannadev/s5-web-pages-midtest/tree/master#readme">
                            Docs
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
}