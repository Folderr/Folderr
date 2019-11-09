$(document).ready( () => {
    AOS.init( { disable: 'mobile' } );
} );

(function ($) {
    // Start of use strict

    // Smooth scrolling using jQuery easing
    $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function () {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            let target = $(this.hash);
            target = target.length ? target : $(`[name=${this.hash.slice(1)}]`);
            if (target.length) {
                $('html, body').animate( {
                    scrollTop: (target.offset().top - 57),
                }, 1000, 'easeInOutExpo');
                return false;
            }
        }
    } );

    // Closes responsive menu when a scroll trigger link is clicked
    $('.js-scroll-trigger').click( () => {
        $('.navbar-collapse').collapse('hide');
    } );

    // Activate scrollspy to add active class to navbar items on scroll
    $('body').scrollspy( {
        target: '#mainNav',
        offset: 57,
    } );

    // Collapse Navbar
    const navbarCollapse = function () {
        if ($('#mainNav').offset().top > 100) {
            $('#mainNav').addClass('navbar-shrink');
        } else {
            $('#mainNav').removeClass('navbar-shrink');
        }
    };
    // Collapse now if page is not at top
    navbarCollapse();
    // Collapse the navbar when page is scrolled
    $(window).scroll(navbarCollapse);
}(jQuery) ); // End of use strict

function loadnavbar() {
    $.ajax( {
        url: '/api/account', success: (data) => {
            if (data && data.owner) {
                $('#manage').removeAttr('id');
            }
            if (data && data.admin) {
                $('#admin').removeAttr('id');
            }
        }, error: (eh, ehh, err) => {
            if (err === 'Unauthorized') {
                return;
            }
            console.log(`Uh, error: ${err || ehh}`);
        },
    } );
}
