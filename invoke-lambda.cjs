const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: 'ap-southeast-1' });

async function invokeDatabaseInit() {
  try {
    console.log('Invoking Database Init Lambda...');
    
    const command = new InvokeCommand({
      FunctionName: 'QuickCorpID-DatabaseInit',
      Payload: JSON.stringify({}),
    });
    
    const response = await lambdaClient.send(command);
    
    console.log('StatusCode:', response.StatusCode);
    
    if (response.Payload) {
      const payload = JSON.parse(Buffer.from(response.Payload).toString());
      console.log('Response:', JSON.stringify(payload, null, 2));
    }
    
    if (response.FunctionError) {
      console.error('Function Error:', response.FunctionError);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

invokeDatabaseInit();
