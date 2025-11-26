try {
    const gql = require('@copilotkit/runtime-client-gql');
    console.log(Object.keys(gql));
} catch (e) {
    console.log("Could not require @copilotkit/runtime-client-gql");
    console.log(e.message);
}
