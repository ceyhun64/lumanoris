<?php

class ParamPosMarketplace
{
    private array $config;
    private ?string $currentOrderId = null;

    public function setOrderContext(?string $orderId): void
    {
        $this->currentOrderId = $orderId;
    }

    public function __construct()
    {
        $this->config = [
            'client_code' => $this->env('PARAM_CLIENT_CODE', '164811'),
            'client_username' => $this->env('PARAM_CLIENT_USERNAME', 'TP10181676'),
            'client_password' => $this->env('PARAM_CLIENT_PASSWORD', 'EFC08709CFD13668'),
            'guid' => $this->env('PARAM_GUID', '79CEF217-9FB9-48F6-A088-20074D7E20F4'),
            'marketplace_guid' => $this->env('PARAM_MARKETPLACE_GUID', $this->env('PARAM_GUID', '79CEF217-9FB9-48F6-A088-20074D7E20F4')),
            'payment_wsdl' => $this->env('PARAM_PAYMENT_WSDL', 'https://posws.param.com.tr/turkpos.ws/service_turkpos_prod.asmx?wsdl'),
            'marketplace_wsdl' => $this->env('PARAM_MARKETPLACE_WSDL', 'https://posws.param.com.tr/turkpos.ws/service_pazaryeri.asmx?wsdl'),
            'security_type' => $this->env('PARAM_PAYMENT_SECURITY_TYPE', '3D'),
            'ref_url' => $this->env('PARAM_REF_URL', $this->baseUrl()),
            'success_url' => $this->env('PARAM_SUCCESS_URL', $this->baseUrl() . '/api/parampos_callback.php'),
            'fail_url' => $this->env('PARAM_FAIL_URL', $this->baseUrl() . '/api/parampos_callback.php'),
        ];
    }

    public function startPayment(array $payment): array
    {
        $this->setOrderContext((string)($payment['order_id'] ?? ''));
        $amount = $this->formatAmount($payment['amount']);
        $installment = (int)($payment['installment'] ?? 1);
        $hash = $this->hash(
            $this->config['client_code']
            . $this->config['guid']
            . $installment
            . $amount
            . $amount
            . $payment['order_id']
            . $this->config['fail_url']
            . $this->config['success_url']
        );

        $securityType = !empty($payment['use_3d']) ? '3D' : 'NS';

        $params = [
            'G' => $this->securityObject(),
            'GUID' => $this->config['guid'],
            'KK_Sahibi' => $payment['card_holder'],
            'KK_No' => preg_replace('/\D+/', '', $payment['card_number']),
            'KK_SK_Ay' => $payment['expiry_month'],
            'KK_SK_Yil' => $payment['expiry_year_2'],
            'KK_CVC' => $payment['cvv'],
            'KK_Sahibi_GSM' => $payment['phone'] ?? '',
            'Hata_URL' => $this->config['fail_url'],
            'Basarili_URL' => $this->config['success_url'],
            'Siparis_ID' => $payment['order_id'],
            'Siparis_Aciklama' => $payment['description'] ?? 'Lumanoris checkout',
            'Taksit' => $installment,
            'Islem_Tutar' => $amount,
            'Toplam_Tutar' => $amount,
            'Islem_Hash' => $hash,
            'Islem_Guvenlik_Tip' => $securityType,
            'Islem_ID' => '',
            'IPAdr' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
            'Ref_URL' => $this->config['ref_url'],
            'Data1' => $payment['order_id'],
            'Data2' => '',
            'Data3' => '',
            'Data4' => '',
            'Data5' => '',
            'Data6' => '',
            'Data7' => '',
            'Data8' => '',
            'Data9' => '',
            'Data10' => '',
        ];

        $result = $this->call($this->config['payment_wsdl'], 'Pos_Odeme', $params, 'Pos_OdemeResult');

        return [
            'success' => (int)($result['Sonuc'] ?? 0) > 0,
            'message' => $result['Sonuc_Str'] ?? '',
            'transaction_id' => (string)($result['Islem_ID'] ?? ''),
            'redirect_url' => (string)($result['UCD_URL'] ?? ''),
            'bank_result_code' => (string)($result['Banka_Sonuc_Kod'] ?? ''),
            'raw' => $result,
        ];
    }

    public function addMarketplaceOrderDetail(string $subMerchantGuid, float $grossAmount, float $payableAmount, string $transactionId): array
    {
        $result = $this->call($this->config['marketplace_wsdl'], 'Pazaryeri_TP_Siparis_Detay_Ekle', [
            'G' => $this->securityObject(),
            'ETS_GUID' => $this->config['marketplace_guid'],
            'Tutar_Urun' => $this->formatAmount($grossAmount),
            'Tutar_Odenecek' => $this->formatAmount($payableAmount),
            'SanalPOS_Islem_ID' => $transactionId,
            'GUID_AltUyeIsyeri' => $subMerchantGuid,
        ], 'Pazaryeri_TP_Siparis_Detay_EkleResult');

        return [
            'success' => (int)($result['Sonuc'] ?? 0) > 0,
            'message' => $result['Sonuc_Str'] ?? '',
            'marketplace_order_guid' => (string)($result['PYSiparis_GUID'] ?? ''),
            'raw' => $result,
        ];
    }

    public function approveMarketplaceOrder(string $pysiparisGuid): array
    {
        $result = $this->call($this->config['marketplace_wsdl'], 'Pazaryeri_TP_Siparis_Onay', [
            'G' => $this->securityObject(),
            'ETS_GUID' => $this->config['marketplace_guid'],
            'PYSiparis_GUID' => $pysiparisGuid,
        ], 'Pazaryeri_TP_Siparis_OnayResult');

        return [
            'success' => (int)($result['Sonuc'] ?? 0) > 0,
            'message' => $result['Sonuc_Str'] ?? '',
            'raw' => $result,
        ];
    }

    public function addSubMerchant(array $params): array
    {
        $result = $this->call($this->config['marketplace_wsdl'], 'Pazaryeri_TP_AltUyeIsyeri_Ekleme', array_merge([
            'G' => $this->securityObject(),
            'ETS_GUID' => $this->config['marketplace_guid'],
        ], $params), 'Pazaryeri_TP_AltUyeIsyeri_EklemeResult');

        return [
            'success' => (int)($result['Sonuc'] ?? 0) > 0,
            'message' => $result['Sonuc_Str'] ?? '',
            'guid_altuyeisyeri' => (string)($result['GUID_AltUyeIsyeri'] ?? ''),
            'raw' => $result,
        ];
    }

    public function updateSubMerchant(array $params): array
    {
        $result = $this->call($this->config['marketplace_wsdl'], 'Pazaryeri_TP_AltUyeIsyeri_Guncelleme', array_merge([
            'G' => $this->securityObject(),
        ], $params), 'Pazaryeri_TP_AltUyeIsyeri_GuncellemeResult');

        return [
            'success' => (int)($result['Sonuc'] ?? 0) > 0,
            'message' => $result['Sonuc_Str'] ?? '',
            'raw' => $result,
        ];
    }

    public function deleteSubMerchant(string $guidAltUyeIsyeri): array
    {
        $result = $this->call($this->config['marketplace_wsdl'], 'Pazaryeri_TP_AltUyeIsyeri_Silme', [
            'G' => $this->securityObject(),
            'GUID_AltUyeIsyeri' => $guidAltUyeIsyeri,
        ], 'Pazaryeri_TP_AltUyeIsyeri_SilmeResult');

        return [
            'success' => (int)($result['Sonuc'] ?? 0) > 0,
            'message' => $result['Sonuc_Str'] ?? '',
            'raw' => $result,
        ];
    }

    public function listSubMerchants(int $limit = 100, int $skip = 0): array
    {
        $result = $this->call($this->config['marketplace_wsdl'], 'Pazaryeri_TP_AltUyeIsyeri_Liste', [
            'G' => $this->securityObject(),
            'ETS_GUID' => $this->config['marketplace_guid'],
            'Limit' => $limit,
            'Skip' => $skip,
        ], 'Pazaryeri_TP_AltUyeIsyeri_ListeResult');

        $list = [];
        if (isset($result['DT_Bilgi'])) {
            $raw = $result['DT_Bilgi'];
            $list = isset($raw[0]) ? $raw : [$raw];
        }

        return [
            'success' => (int)($result['Sonuc'] ?? 0) > 0,
            'message' => $result['Sonuc_Str'] ?? '',
            'total' => (int)($result['Toplam_Kayit'] ?? 0),
            'items' => $list,
            'raw' => $result,
        ];
    }

    public function listIller(): array
    {
        $result = $this->call($this->config['marketplace_wsdl'], 'IL_LISTESI', [
            'G' => $this->securityObject(),
            'ETS_GUID' => $this->config['marketplace_guid'],
        ], 'IL_LISTESIResult');

        $rows = $this->extractDiffgramRows($result);
        $items = [];
        foreach ($rows as $row) {
            $items[] = [
                'IL_Kodu' => (int)($row['Plaka'] ?? 0),
                'IL_Adi' => (string)($row['IL'] ?? ''),
            ];
        }

        return [
            'success' => !empty($items) || (int)($result['Sonuc'] ?? 0) > 0,
            'message' => $result['Sonuc_Str'] ?? '',
            'items' => $items,
            'raw' => $result,
        ];
    }

    public function listIlceler(int $ilKodu): array
    {
        $result = $this->call($this->config['marketplace_wsdl'], 'ILCE_LISTESI', [
            'G' => $this->securityObject(),
            'ETS_GUID' => $this->config['marketplace_guid'],
            'Il_Plaka' => $ilKodu,
        ], 'ILCE_LISTESIResult');

        $rows = $this->extractDiffgramRows($result);
        $items = [];
        foreach ($rows as $row) {
            $items[] = [
                'Ilce_Kodu' => (int)($row['ID'] ?? $row['TBL_MERNIS_ILCEKOD'] ?? $row['ILCE_KOD'] ?? $row['Kodu'] ?? 0),
                'Ilce_Adi' => (string)($row['ILCE'] ?? $row['Ilce'] ?? $row['Adi'] ?? ''),
            ];
        }

        return [
            'success' => !empty($items) || (int)($result['Sonuc'] ?? 0) > 0,
            'message' => $result['Sonuc_Str'] ?? '',
            'items' => $items,
            'raw' => $result,
        ];
    }

    private function extractDiffgramRows(array $result): array
    {
        $xml = $this->findAnyXml($result);
        if ($xml === '') {
            return [];
        }

        $prev = libxml_use_internal_errors(true);
        $doc = new DOMDocument();
        if (!$doc->loadXML('<root xmlns:diffgr="urn:schemas-microsoft-com:xml-diffgram-v1" xmlns:msdata="urn:schemas-microsoft-com:xml-msdata">' . $xml . '</root>')) {
            libxml_clear_errors();
            libxml_use_internal_errors($prev);
            return [];
        }
        libxml_use_internal_errors($prev);

        $xpath = new DOMXPath($doc);
        $xpath->registerNamespace('diffgr', 'urn:schemas-microsoft-com:xml-diffgram-v1');

        $rows = [];
        $nodes = $xpath->query('//diffgr:diffgram/*/*');
        if (!$nodes || $nodes->length === 0) {
            $nodes = $xpath->query('//*[local-name()="diffgram"]/*/*');
        }
        if ($nodes) {
            foreach ($nodes as $row) {
                $entry = [];
                foreach ($row->childNodes as $child) {
                    if ($child->nodeType === XML_ELEMENT_NODE) {
                        $entry[$child->localName] = $child->nodeValue;
                    }
                }
                if (!empty($entry)) {
                    $rows[] = $entry;
                }
            }
        }
        return $rows;
    }

    private function findAnyXml($node): string
    {
        if (is_string($node)) {
            if (stripos($node, '<diffgr:diffgram') !== false || stripos($node, 'diffgram') !== false || stripos($node, '<NewDataSet') !== false) {
                return $node;
            }
            return '';
        }
        if (is_object($node)) {
            $node = (array)$node;
        }
        if (!is_array($node)) {
            return '';
        }
        if (isset($node['any']) && is_string($node['any'])) {
            return (string)$node['any'];
        }
        foreach ($node as $value) {
            $found = $this->findAnyXml($value);
            if ($found !== '') {
                return $found;
            }
        }
        return '';
    }

    public function cancelOrRefund(string $pysiparisGuid): array
    {
        $result = $this->call($this->config['marketplace_wsdl'], 'Pazaryeri_TP_Iptal_Iade', [
            'G' => $this->securityObject(),
            'ETS_GUID' => $this->config['marketplace_guid'],
            'PYSiparis_GUID' => $pysiparisGuid,
        ], 'Pazaryeri_TP_Iptal_IadeResult');

        return [
            'success' => (int)($result['Sonuc'] ?? 0) > 0,
            'message' => $result['Sonuc_Str'] ?? '',
            'raw' => $result,
        ];
    }

    public function queryTransaction(string $orderId): array
    {
        $result = $this->call($this->config['marketplace_wsdl'], 'Pazaryeri_TP_Islem_Sorgulama', [
            'G' => $this->securityObject(),
            'ETS_GUID' => $this->config['marketplace_guid'],
            'Siparis_ID' => $orderId,
        ], 'Pazaryeri_TP_Islem_SorgulamaResult');

        return [
            'success' => (int)($result['Sonuc'] ?? 0) > 0,
            'message' => $result['Sonuc_Str'] ?? '',
            'raw' => $result,
        ];
    }

    public function verifyCallbackHash(array $post): bool
    {
        $dekontId = (string)($post['TURKPOS_RETVAL_Dekont_ID'] ?? '');
        $orderId = (string)($post['TURKPOS_RETVAL_Siparis_ID'] ?? '');
        $islemId = (string)($post['TURKPOS_RETVAL_Islem_ID'] ?? '');
        $received = (string)($post['TURKPOS_RETVAL_Hash'] ?? '');

        foreach (['TURKPOS_RETVAL_Tahsilat_Tutari', 'TURKPOS_RETVAL_Odeme_Tutari'] as $amountKey) {
            $amount = (string)($post[$amountKey] ?? '');
            if ($amount === '') {
                continue;
            }

            $expected = $this->hash($this->config['client_code'] . $this->config['guid'] . $dekontId . $amount . $orderId . $islemId);
            if (hash_equals($expected, $received)) {
                return true;
            }
        }

        return false;
    }

    public function formatAmount(float $amount): string
    {
        return number_format($amount, 2, ',', '');
    }

    private function call(string $wsdl, string $method, array $params, string $resultKey): array
    {
        if (!class_exists('SoapClient')) {
            throw new Exception('PHP SOAP eklentisi aktif değil.');
        }

        $startedAt = microtime(true);
        $requestXml = null;
        $responseXml = null;
        $errorMessage = null;
        $resultData = [];

        try {
            $client = new SoapClient($wsdl, [
                'trace' => true,
                'exceptions' => true,
                'connection_timeout' => 30,
                'stream_context' => stream_context_create([
                    'http' => ['timeout' => 45],
                    'ssl'  => ['timeout' => 45],
                ]),
            ]);

            $response = $client->__soapCall($method, [$params]);
            $requestXml = $client->__getLastRequest();
            $responseXml = $client->__getLastResponse();
            error_log('[SOAP] Method: ' . $method);

            $data = json_decode(json_encode($response), true);
            if (isset($data[$resultKey]) && is_array($data[$resultKey])) {
                $resultData = $data[$resultKey];
            } else {
                $resultData = is_array($data) ? $data : [];
            }
        } catch (SoapFault $e) {
            $errorMessage = $e->getMessage() . ' code:' . $e->faultcode;
            error_log('[SOAP] SoapFault on ' . $method . ': ' . $errorMessage);
            $this->logSoapCall($wsdl, $method, $requestXml, $responseXml, [], $errorMessage, $startedAt);
            throw new Exception('SOAP hatası (' . $method . '): ' . $e->getMessage());
        }

        $this->logSoapCall($wsdl, $method, $requestXml, $responseXml, $resultData, null, $startedAt);
        return $resultData;
    }

    private function logSoapCall(string $wsdl, string $method, ?string $requestXml, ?string $responseXml, array $resultData, ?string $errorMessage, float $startedAt): void
    {
        try {
            if (!class_exists('Database')) {
                return;
            }
            $conn = Database::getInstance()->getConnection();
            $stmt = $conn->prepare(
                'INSERT INTO `param_marketplace_soap_log`
                 (`order_id`, `method`, `wsdl`, `request_xml`, `response_xml`, `result_code`, `result_message`, `duration_ms`, `error_message`)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $this->currentOrderId,
                $method,
                $wsdl,
                $this->scrubSecrets((string)$requestXml),
                (string)$responseXml,
                isset($resultData['Sonuc']) ? (string)$resultData['Sonuc'] : null,
                isset($resultData['Sonuc_Str']) ? (string)$resultData['Sonuc_Str'] : null,
                (int)round((microtime(true) - $startedAt) * 1000),
                $errorMessage,
            ]);
        } catch (Throwable $e) {
            error_log('[SOAP] audit log write failed: ' . $e->getMessage());
        }
    }

    private function scrubSecrets(string $xml): string
    {
        $xml = preg_replace('/(<KK_No>)([^<]*)(<\/KK_No>)/i', '$1[REDACTED]$3', $xml ?? '');
        $xml = preg_replace('/(<KK_CVC>)([^<]*)(<\/KK_CVC>)/i', '$1[REDACTED]$3', $xml ?? '');
        $xml = preg_replace('/(<CLIENT_PASSWORD>)([^<]*)(<\/CLIENT_PASSWORD>)/i', '$1[REDACTED]$3', $xml ?? '');
        return (string)$xml;
    }

    private function hash(string $value): string
    {
        return base64_encode(sha1(mb_convert_encoding($value, 'ISO-8859-9', 'UTF-8'), true));
    }

    private function securityObject(): array
    {
        return [
            'CLIENT_CODE' => $this->config['client_code'],
            'CLIENT_USERNAME' => $this->config['client_username'],
            'CLIENT_PASSWORD' => $this->config['client_password'],
        ];
    }

    private function env(string $key, ?string $default = null): ?string
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
        return ($value === false || $value === null || $value === '') ? $default : $value;
    }

    private function baseUrl(): string
    {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';
        return $scheme . '://' . $host;
    }
}

?>
