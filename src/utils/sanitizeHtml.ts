import sanitizeHtml from 'sanitize-html';

const DefaultAllowed = {
	allowedTags: [
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'blockquote',
		'p',
		'a',
		'ul',
		'ol',
		'nl',
		'li',
		'b',
		'i',
		'strong',
		'em',
		'strike',
		'code',
		'hr',
		'br',
		'div',
		'table',
		'thead',
		'caption',
		'tbody',
		'tr',
		'th',
		'td',
		'pre',
		'span',
		'img',
		'br',
		'hr',
		'iframe'
	],
	allowedAttributes: {
		p: ['style', 'class'],
		a: ['href', 'name', 'target', 'class', 'style', 'class'],
		img: ['src', 'alt', 'class', 'height', 'width', 'style', 'class'],
		div: ['style', 'class'],
		span: ['style', 'class'],
		iframe: ['style', 'height', 'width', 'allowfullscreen', 'autoplay', 'src', 'class']
	},
	selfClosing: ['img', 'br', 'hr'],
	allowedSchemes: ['http', 'https', 'ftp', 'mailto'],
	allowedSchemesByTag: {},
	allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
	allowProtocolRelative: true
};

export default function clean(dataValue) {
	return sanitizeHtml(dataValue, DefaultAllowed);
}
