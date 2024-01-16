module.exports = async function getUser(id) {
	const response = await fetch(`https://gitlab.com/api/v4/users/${id}?access_token=${process.env.gitlab_access_token}`, {
		method: "GET",
	});
	let json = await response.json();
	return json;
};
