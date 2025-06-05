import AWS from 'aws-sdk';
import { fetchData } from './externapi';

const loadAwsConfigFromApi = async () => {
    try {
        const configData = await fetchData('ConfigValues/all', { skip: 0, take: 0 });

        if (!configData || configData.length === 0) {
            console.log('AWS configuration not found in config data');
        }

        const configValueawsAccessKeyId = configData.find(item => item.ConfigKey === 'awsAccessKeyId');
        const configValueSecretKey = configData.find(item => item.ConfigKey === 'awsSecretAccessKey');
        const configValueRegion = configData.find(item => item.ConfigKey === 'awsRegion');

        if (!configValueawsAccessKeyId || !configValueSecretKey || !configValueRegion) {
            console.error('Missing required AWS configuration values');
        }

        AWS.config.update({
            region: configValueRegion.ConfigValue,
            credentials: new AWS.Credentials({
                accessKeyId: configValueawsAccessKeyId.ConfigValue,
                secretAccessKey: configValueSecretKey.ConfigValue
            })
        });

        return new AWS.CloudWatchLogs();
    } catch (error) {
        console.error('Error loading AWS configuration from API:', error);
    }
};

export const logToCloudWatch = async (logGroupName, logStreamName, message) => {
    try {
        const cloudwatchlogs = await loadAwsConfigFromApi();

        const logEvents = [{
            message: JSON.stringify(message),
            timestamp: new Date().getTime()
        }];

        // log group and log stream creation 

        //await cloudwatchlogs.createLogGroup({ logGroupName }).promise().catch(() => { });
        const logStreams = await cloudwatchlogs.describeLogStreams({ logGroupName }).promise();
        const logStreamExists = logStreams.logStreams.some(stream => stream.logStreamName === logStreamName);

        if (!logStreamExists) {
            const cl2 = await cloudwatchlogs.createLogStream({ logGroupName, logStreamName }).promise().catch(() => { });
        }

        const params = {
            logGroupName,
            logStreamName,
            logEvents
        };

        await cloudwatchlogs.putLogEvents(params).promise();
        console.log('Log successfully sent to CloudWatch');
    } catch (error) {
        console.error('Error sending log to CloudWatch:', error);
    }
};

// Example usage
export const initializeLogging = async () => {
    try {
        const cloudwatch = await loadAwsConfigFromApi();
        console.log('AWS CloudWatch configuration initialized successfully');
        return cloudwatch;
    } catch (error) {
        console.error('Failed to initialize AWS CloudWatch:', error);
    }
};