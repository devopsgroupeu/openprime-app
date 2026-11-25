// src/components/icons/ServiceIcon.jsx
// Official AWS Architecture service icons (aws-icons, MIT). Services without
// an AWS icon fall back to the lucide icon from getServiceIcon.
import vpc from "aws-icons/icons/architecture-service/AmazonVirtualPrivateCloud.svg";
import eks from "aws-icons/icons/architecture-service/AmazonElasticKubernetesService.svg";
import msk from "aws-icons/icons/architecture-service/AmazonManagedStreamingforApacheKafka.svg";
import rds from "aws-icons/icons/architecture-service/AmazonRDS.svg";
import aurora from "aws-icons/icons/architecture-service/AmazonAurora.svg";
import opensearch from "aws-icons/icons/architecture-service/AmazonOpenSearchService.svg";
import elasticache from "aws-icons/icons/architecture-service/AmazonElastiCache.svg";
import ecr from "aws-icons/icons/architecture-service/AmazonElasticContainerRegistry.svg";
import waf from "aws-icons/icons/architecture-service/AWSWAF.svg";
import s3 from "aws-icons/icons/architecture-service/AmazonSimpleStorageService.svg";
import lambda from "aws-icons/icons/architecture-service/AWSLambda.svg";
import sqs from "aws-icons/icons/architecture-service/AmazonSimpleQueueService.svg";
import sns from "aws-icons/icons/architecture-service/AmazonSimpleNotificationService.svg";
import cloudfront from "aws-icons/icons/architecture-service/AmazonCloudFront.svg";
import route53 from "aws-icons/icons/architecture-service/AmazonRoute53.svg";
import { getServiceIcon } from "../../config/serviceIcons";
import { cn } from "../../lib/utils";

const AWS_ICON_URLS = {
  vpc,
  eks,
  msk,
  rds,
  aurora,
  opensearch,
  elasticache,
  ecr,
  waf,
  s3,
  lambda,
  sqs,
  sns,
  cloudfront,
  route53,
};

const ServiceIcon = ({ service, className }) => {
  const url = Object.hasOwn(AWS_ICON_URLS, service)
    ? AWS_ICON_URLS[service]
    : null;
  if (url) {
    return (
      <img
        src={url}
        alt=""
        draggable={false}
        className={cn("shrink-0 rounded-md", className)}
      />
    );
  }
  const Icon = getServiceIcon(service);
  return <Icon aria-hidden="true" className={cn("shrink-0", className)} />;
};

export default ServiceIcon;
