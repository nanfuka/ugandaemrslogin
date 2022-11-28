import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  InlineNotification,
  PasswordInput,
  TextInput,
  Tile,
  Layer,
  Select,
  SelectItem,
} from "@carbon/react";
import { ArrowLeft, ArrowRight } from "@carbon/react/icons";
import { useTranslation } from "react-i18next";
import {
  useConfig,
  interpolateUrl,
  useSession,
  useLayoutType,
  openmrsFetch,
} from "@openmrs/esm-framework";
import { performLogin } from "./login.resource";
import styles from "./login.scss";

const hidden: React.CSSProperties = {
  height: 0,
  width: 0,
  border: 0,
  padding: 0,
};

export interface LoginReferrer {
  referrer?: string;
}

export interface LoginProps extends LoginReferrer {
  isLoginEnabled: boolean;
}

const Login: React.FC<LoginProps> = ({ isLoginEnabled }) => {
  const config = useConfig();
  const { t } = useTranslation();
  const { user } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const showPassword = location.pathname === "/login/confirm";
  const [userLocation, setUserLocation] = useState("");
  const isTablet = useLayoutType() === "tablet";

  function perf(username, password) {
    var token = window.btoa("".concat(username, ":").concat(password));
    return openmrsFetch("/ws/fhir2/R4/Location", {
      headers: {
        Authorization: "Basic ".concat(token),
      },
    }).then(function (res) {
      return res;
    });
  }
  const [locations, setlocations] = useState([]);
  useEffect(() => {
    async function per() {
      const lo = await perf("admin", "Admin123");
      setlocations(lo.data.entry);
    }
    per();
  });

  const locationSelect = (
    <Select
      className={styles["input-group"]}
      id="location"
      invalidText="Required"
      labelText={t("selectLocation", "Select a location")}
      onChange={(event) => setUserLocation(event.target.value)}
      value={userLocation}
    >
      {!userLocation ? (
        <SelectItem text={t("chooseLocation", "Choose a location")} value="" />
      ) : null}
      {locations?.length > 0 &&
        locations.map((location) => (
          <SelectItem
            key={location.resource.id}
            text={location.resource.description}
            value={location.resource.id}
          >
            {location.display}
          </SelectItem>
        ))}
    </Select>
  );

  useEffect(() => {
    if (user && userLocation) {
      navigate("/dashboard/home", { state: location.state });
    } else if (!username && location.pathname === "/login/confirm") {
      navigate("/login", { state: location.state });
    }
  }, [username, navigate, location, user]);

  useEffect(() => {
    const field = showPassword
      ? passwordInputRef.current
      : usernameInputRef.current;

    if (field) {
      field.focus();
    }
  }, [showPassword]);

  useEffect(() => {
    if (!user && config.provider.type === "oauth2") {
      const loginUrl = config.provider.loginUrl;
      window.location.href = loginUrl;
    }
  }, [config, user]);

  const continueLogin = useCallback(() => {
    const field = usernameInputRef.current;

    if (field.value.length > 0) {
      navigate("/login/confirm", { state: location.state });
    } else {
      field.focus();
    }
  }, [navigate]);

  const changeUsername = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setUsername(evt.target.value),
    []
  );

  const changePassword = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setPassword(evt.target.value),
    []
  );

  const resetUserNameAndPassword = useCallback(() => {
    setUsername("");
    setPassword("");
  }, []);

  const handleSubmit = useCallback(
    async (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      evt.stopPropagation();

      try {
        const loginRes = await performLogin(username, password);
        const authData = loginRes.data;
        const valid = authData && authData.authenticated;

        if (!valid) {
          throw new Error("invalidCredentials");
        }
      } catch (error) {
        setErrorMessage(error.message);
        resetUserNameAndPassword();
      }

      return false;
    },
    [continueLogin, resetUserNameAndPassword, showPassword, username, password]
  );

  const logo = config.logo.src ? (
    <img
      src={interpolateUrl(config.logo.src)}
      alt={config.logo.alt}
      className={styles["logo-img"]}
    />
  ) : (
    <svg role="img" className={styles["logo"]}>
      <title>OpenMRS logo</title>
      <use xlinkHref="#omrs-logo-full-color"></use>
    </svg>
  );

  if (config.provider.type === "basic") {
    return (
      <div className={`canvas ${styles["container"]}`}>
        {errorMessage && (
          <InlineNotification
            kind="error"
            style={{ width: "23rem", marginBottom: "3rem" }}
            /**
             * This comment tells i18n to still keep the following translation keys (used as value for: errorMessage):
             * t('invalidCredentials')
             */
            subtitle={t(errorMessage)}
            title={t("error", "Error")}
            onClick={() => setErrorMessage("")}
          />
        )}
        <Tile className={styles["login-card"]}>
          {showPassword ? (
            <div className={styles["back-button-div"]}>
              <Button
                className={styles["back-button"]}
                iconDescription="Back to username"
                kind="ghost"
                onClick={() => navigate("/login")}
                renderIcon={(props) => (
                  <ArrowLeft
                    size={24}
                    style={{ marginRight: "0.5rem" }}
                    {...props}
                  />
                )}
              >
                <span>{t("back", "Back")}</span>
              </Button>
            </div>
          ) : null}
          <div className={styles["center"]}>{logo}</div>
          <form onSubmit={handleSubmit} ref={formRef}>
            {/* {!showPassword && ( */}
            <div className={styles["input-group"]}>
              <TextInput
                id="username"
                type="text"
                name="username"
                labelText={t("username", "Username")}
                value={username}
                onChange={changeUsername}
                ref={usernameInputRef}
                autoFocus
                required
              />
            </div>
            <div className={styles["input-group"]}>
              <PasswordInput
                id="password"
                invalidText={t(
                  "validValueRequired",
                  "A valid value is required"
                )}
                labelText={t("password", "Password")}
                name="password"
                value={password}
                onChange={changePassword}
                ref={passwordInputRef}
                required
                showPasswordLabel="Show password"
              />

              <div>
                {isTablet ? <Layer>{locationSelect}</Layer> : locationSelect}
              </div>

              <Button
                type="submit"
                className={styles.continueButton}
                renderIcon={(props) => <ArrowRight size={24} {...props} />}
                iconDescription="Log in"
                disabled={!isLoginEnabled}
              >
                {t("login", "Log in")}
              </Button>
            </div>
            {/* )} */}
          </form>
        </Tile>

        <div className={styles["need-help"]}>
          <p className={styles["need-help-txt"]}>
            {t("needHelp", "Need help?")}
            <Button kind="ghost">
              {t("contactAdmin", "Contact the site administrator")}
            </Button>
          </p>
        </div>
        <div className={styles["footer"]}>
          <p className={styles["powered-by-txt"]}>
            {t("poweredBy", "Powered by")}
          </p>
          <div>
            <svg role="img" className={styles["powered-by-logo"]}>
              <use xlinkHref="#omrs-logo-partial-mono"></use>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Login;
