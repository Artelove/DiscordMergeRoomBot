module.exports = async function getRawFile(project_id, file_name, branch_name, start_line = 0, end_line = 0) {
	const response = await fetch(
		`https://gitlab.com/api/v4/projects/${project_id}/repository/files/${encodeURI(file_name)}/raw/?ref=${encodeURI(branch_name)}&access_token=${
			process.env.gitlab_access_token
		}`,
		{
			method: "GET",
		}
	);
	return await response.text();
};
