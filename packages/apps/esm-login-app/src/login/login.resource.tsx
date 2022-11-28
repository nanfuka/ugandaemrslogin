import { openmrsFetch, refetchCurrentUser } from "@openmrs/esm-framework";

export function performLogin(username, password) {
  console.log("do you get here");
  const token = window.btoa(`${username}:${password}`);
  return openmrsFetch(`/ws/rest/v1/session`, {
    headers: {
      Authorization: `Basic ${token}`,
    },
  }).then((res) => {
    refetchCurrentUser();
    return res;
  });
}
