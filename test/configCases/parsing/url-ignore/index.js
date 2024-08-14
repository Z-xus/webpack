it("should ignore", function() {
	const url = new URL(/* webpackIgnore: true */ "file1.css", import.meta.url);
	expect(url.pathname.endsWith("file1.css")).toBe(true);
	expect(url.pathname.includes("/public/")).toBe(false);
	const url2 = new URL(/* webpackIgnore: false */ "file2.css", import.meta.url);
	expect(/\/public\/.+\.css/.test(url2.pathname)).toBe(true);
	const url3 = new URL(/* webpackIgnore: true */ "fil" + "e3.css", import.meta.url);
	expect(url3.pathname.endsWith("file3.css")).toBe(true);
	const url4 = new URL(/* webpackIgnore: false */ "fil" + "e4.css", import.meta.url);
	expect(/\/public\/.+\.css/.test(url4.pathname)).toBe(true);
	const url5 = new URL(/* webpackIgnore: "test" */ "file5.css", import.meta.url);
	expect(url5.pathname.endsWith("file5.css")).toBe(true);
	const value = "file5.css";
	const url6 = new URL(/* webpackIgnore: true */ "/dir/" + value, import.meta.url);
	expect(url6.pathname.endsWith("file5.css")).toBe(true);
	const args = ["file3.css", document.baseURI || self.location.href];
	const url7 = new URL(...args);
	expect(url7.pathname.endsWith("file3.css")).toBe(true);
	const url8 = new URL(document.baseURI || self.location.href);
	expect(url8.toString()).toBe(document.baseURI || self.location.href);
	const url9 = new URL(self.location.href);
	expect(url9.toString()).toBe(self.location.href);
});
